import { doc, setDoc, onSnapshot, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface VoicePeerState {
  uid: string;
  displayName: string;
  characterName?: string;
  role: 'Player' | 'DM';
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  micVolume: number; // 0 to 100
  updatedAt: string;
}

export interface VoiceSignalData {
  id: string; // senderUid_receiverUid
  senderUid: string;
  receiverUid: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  payload: any;
  createdAt: string;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export class WebRTCVoiceManager {
  private sessionCode: string = '';
  private localUid: string = '';
  private localUser: { displayName: string; role: 'Player' | 'DM'; characterName?: string } = {
    displayName: 'Adventurer',
    role: 'Player'
  };

  private localStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private speechInterval: number | null = null;

  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private userVolumes: Map<string, number> = new Map(); // uid -> volume (0.0 to 2.0)

  private isMuted: boolean = false;
  private isDeafened: boolean = false;
  private isSpeaking: boolean = false;
  private isPushToTalk: boolean = false;
  private pttPressed: boolean = false;

  private activePeers: Map<string, VoicePeerState> = new Map();
  private onPeersUpdateCallbacks: Set<(peers: VoicePeerState[]) => void> = new Set();
  private onConnectionStatusCallbacks: Set<(status: 'disconnected' | 'connecting' | 'connected' | 'error', errorMsg?: string) => void> = new Set();

  private unsubscribePeersListener: (() => void) | null = null;
  private unsubscribeSignalsListener: (() => void) | null = null;
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('dnd_party_voice_channel');
      } catch {
        this.broadcastChannel = null;
      }
    }
  }

  /**
   * Start microphone input and join the party voice session
   */
  public async joinVoice(
    sessionCode: string,
    user: { uid: string; displayName: string; role: 'Player' | 'DM'; characterName?: string }
  ): Promise<boolean> {
    this.sessionCode = sessionCode.trim().toUpperCase();
    this.localUid = user.uid;
    this.localUser = user;

    this.notifyStatus('connecting');

    try {
      // Get user audio media stream
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        });
      } catch (err: any) {
        console.warn('Microphone access denied or unavailable:', err);
        this.notifyStatus('error', 'Microphone access denied or no input device found.');
        // Initialize fallback state without active audio track
        this.localStream = null;
      }

      // Setup audio analyzer for speech volume detection
      if (this.localStream) {
        this.setupAudioAnalyser();
      }

      // Publish local presence to session
      await this.publishLocalPresence();

      // Listen for other peers in session
      this.subscribeToPeers();

      // Listen for incoming WebRTC signals
      this.subscribeToSignals();

      this.notifyStatus('connected');
      return true;
    } catch (err: any) {
      console.error('Failed to initialize WebRTC Voice:', err);
      this.notifyStatus('error', err?.message || 'Failed to connect to Voice Channel');
      return false;
    }
  }

  /**
   * Setup Web Audio API Analyser to detect speech volume & speaking state
   */
  private setupAudioAnalyser() {
    if (!this.localStream) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.localStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      if (this.speechInterval) window.clearInterval(this.speechInterval);

      this.speechInterval = window.setInterval(() => {
        if (!this.analyser || this.isMuted || this.isDeafened || (this.isPushToTalk && !this.pttPressed)) {
          if (this.isSpeaking) {
            this.isSpeaking = false;
            this.publishLocalPresence();
          }
          return;
        }

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const nowSpeaking = average > 18; // Threshold for speech detection

        if (nowSpeaking !== this.isSpeaking) {
          this.isSpeaking = nowSpeaking;
          this.publishLocalPresence();
        }
      }, 150);
    } catch (e) {
      console.warn('Could not setup Audio Context analyser:', e);
    }
  }

  /**
   * Publish or update local presence in Firestore/Local Broadcast
   */
  public async publishLocalPresence() {
    if (!this.sessionCode || !this.localUid) return;

    const state: VoicePeerState = {
      uid: this.localUid,
      displayName: this.localUser.displayName,
      characterName: this.localUser.characterName,
      role: this.localUser.role,
      isMuted: this.isMuted || (this.isPushToTalk && !this.pttPressed),
      isDeafened: this.isDeafened,
      isSpeaking: this.isSpeaking && !this.isMuted && (!this.isPushToTalk || this.pttPressed),
      micVolume: 100,
      updatedAt: new Date().toISOString()
    };

    // Update internal activePeers list
    this.activePeers.set(this.localUid, state);
    this.notifyPeers();

    // Broadcast locally to other tabs
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'VOICE_PEER_UPDATE', state, sessionCode: this.sessionCode });
    }

    // Sync to Firestore
    try {
      const peerDocRef = doc(db, 'sessions', this.sessionCode, 'voice_peers', this.localUid);
      await setDoc(peerDocRef, state, { merge: true });
    } catch (e) {
      // Offline fallback ignored
    }
  }

  /**
   * Listen for active peers in the session room
   */
  private subscribeToPeers() {
    if (!this.sessionCode) return;

    try {
      const peersCol = collection(db, 'sessions', this.sessionCode, 'voice_peers');
      this.unsubscribePeersListener = onSnapshot(
        peersCol,
        (snapshot) => {
          snapshot.forEach((doc) => {
            const data = doc.data() as VoicePeerState;
            if (data && data.uid) {
              this.activePeers.set(data.uid, data);
              // Initiate peer connection if new remote peer
              if (data.uid !== this.localUid && !this.peerConnections.has(data.uid)) {
                this.initiatePeerConnection(data.uid);
              }
            }
          });
          this.notifyPeers();
        },
        (error) => {
          console.warn('Voice peers snapshot listener error:', error);
        }
      );
    } catch (e) {
      console.warn('Firestore voice peers listener info:', e);
    }

    // Listen to local BroadcastChannel messages
    if (this.broadcastChannel) {
      this.broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'VOICE_PEER_UPDATE' && event.data?.sessionCode === this.sessionCode) {
          const state = event.data.state as VoicePeerState;
          if (state && state.uid) {
            this.activePeers.set(state.uid, state);
            if (state.uid !== this.localUid && !this.peerConnections.has(state.uid)) {
              this.initiatePeerConnection(state.uid);
            }
            this.notifyPeers();
          }
        }
      };
    }
  }

  /**
   * Setup WebRTC peer connection to a remote user
   */
  private initiatePeerConnection(remoteUid: string) {
    if (this.peerConnections.has(remoteUid)) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnections.set(remoteUid, pc);

    // Add local tracks to connection
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming remote audio stream track
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      this.remoteStreams.set(remoteUid, remoteStream);
      this.playRemoteAudioStream(remoteUid, remoteStream);
    };

    // ICE candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(remoteUid, 'ice-candidate', event.candidate);
      }
    };

    // If localUid > remoteUid, localUid acts as caller/offerer
    if (this.localUid > remoteUid) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          if (pc.localDescription) {
            this.sendSignal(remoteUid, 'offer', pc.localDescription);
          }
        })
        .catch((err) => console.warn('Error creating WebRTC offer:', err));
    }
  }

  /**
   * Play remote audio stream with user specific volume control
   */
  private playRemoteAudioStream(remoteUid: string, stream: MediaStream) {
    let audioEl = this.remoteAudioElements.get(remoteUid);
    if (!audioEl) {
      audioEl = new Audio();
      audioEl.autoplay = true;
      audioEl.volume = this.userVolumes.get(remoteUid) ?? 1.0;
      this.remoteAudioElements.set(remoteUid, audioEl);
    }
    audioEl.srcObject = stream;
    audioEl.muted = this.isDeafened;
    audioEl.play().catch(() => {
      // Audio autoplay policy catch
    });
  }

  /**
   * Send WebRTC signaling message via Firestore
   */
  private async sendSignal(receiverUid: string, type: 'offer' | 'answer' | 'ice-candidate', payload: any) {
    if (!this.sessionCode) return;
    const signalId = `${this.localUid}_${receiverUid}_${Date.now()}`;
    const signal: VoiceSignalData = {
      id: signalId,
      senderUid: this.localUid,
      receiverUid,
      type,
      payload,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = doc(db, 'sessions', this.sessionCode, 'voice_signals', signalId);
      await setDoc(docRef, signal);
    } catch (e) {
      // Fallback channel
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type: 'WEBRTC_SIGNAL', signal, sessionCode: this.sessionCode });
      }
    }
  }

  /**
   * Subscribe to WebRTC signaling messages
   */
  private subscribeToSignals() {
    if (!this.sessionCode) return;

    try {
      const signalsCol = collection(db, 'sessions', this.sessionCode, 'voice_signals');
      this.unsubscribeSignalsListener = onSnapshot(
        signalsCol,
        (snapshot) => {
          snapshot.forEach(async (docSnap) => {
            const signal = docSnap.data() as VoiceSignalData;
            if (signal && signal.receiverUid === this.localUid && signal.senderUid !== this.localUid) {
              await this.handleIncomingSignal(signal);
              // Delete signal after processing
              try {
                await deleteDoc(docSnap.ref);
              } catch (e) {}
            }
          });
        },
        (error) => {
          console.warn('Voice signals snapshot listener error:', error);
        }
      );
    } catch (e) {}
  }

  /**
   * Process incoming WebRTC Offer, Answer or ICE Candidate
   */
  private async handleIncomingSignal(signal: VoiceSignalData) {
    const senderUid = signal.senderUid;
    let pc = this.peerConnections.get(senderUid);

    if (!pc) {
      this.initiatePeerConnection(senderUid);
      pc = this.peerConnections.get(senderUid)!;
    }

    try {
      if (signal.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await this.sendSignal(senderUid, 'answer', pc.localDescription);
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
      } else if (signal.type === 'ice-candidate') {
        await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
      }
    } catch (err) {
      console.warn('Error handling WebRTC signal:', err);
    }
  }

  // ==========================================
  // CONTROLS & STATE MODIFIERS
  // ==========================================

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => {
        t.enabled = !this.isMuted;
      });
    }
    this.publishLocalPresence();
    return this.isMuted;
  }

  public toggleDeafen(): boolean {
    this.isDeafened = !this.isDeafened;
    // Mute/unmute all incoming remote streams
    this.remoteAudioElements.forEach((audioEl) => {
      audioEl.muted = this.isDeafened;
    });
    this.publishLocalPresence();
    return this.isDeafened;
  }

  public setPushToTalkMode(enabled: boolean) {
    this.isPushToTalk = enabled;
    this.publishLocalPresence();
  }

  public setPttPressed(pressed: boolean) {
    if (this.pttPressed !== pressed) {
      this.pttPressed = pressed;
      if (this.localStream) {
        this.localStream.getAudioTracks().forEach((t) => {
          t.enabled = !this.isMuted && (!this.isPushToTalk || this.pttPressed);
        });
      }
      this.publishLocalPresence();
    }
  }

  public setUserVolume(uid: string, volume: number) {
    this.userVolumes.set(uid, volume);
    const audioEl = this.remoteAudioElements.get(uid);
    if (audioEl) {
      audioEl.volume = Math.max(0, Math.min(2, volume));
    }
  }

  public getUserVolume(uid: string): number {
    return this.userVolumes.get(uid) ?? 1.0;
  }

  public getLocalState() {
    return {
      isMuted: this.isMuted,
      isDeafened: this.isDeafened,
      isSpeaking: this.isSpeaking,
      isPushToTalk: this.isPushToTalk
    };
  }

  /**
   * Leave Voice Session & cleanup
   */
  public leaveVoice() {
    if (this.speechInterval) window.clearInterval(this.speechInterval);

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    this.remoteAudioElements.forEach((audioEl) => {
      audioEl.pause();
      audioEl.srcObject = null;
    });
    this.remoteAudioElements.clear();
    this.remoteStreams.clear();

    if (this.sessionCode && this.localUid) {
      try {
        deleteDoc(doc(db, 'sessions', this.sessionCode, 'voice_peers', this.localUid)).catch(() => {});
      } catch (e) {}
    }

    if (this.unsubscribePeersListener) this.unsubscribePeersListener();
    if (this.unsubscribeSignalsListener) this.unsubscribeSignalsListener();

    this.activePeers.clear();
    this.notifyPeers();
    this.notifyStatus('disconnected');
  }

  // Subscriber pattern
  public onPeersChange(callback: (peers: VoicePeerState[]) => void): () => void {
    this.onPeersUpdateCallbacks.add(callback);
    callback(Array.from(this.activePeers.values()));
    return () => {
      this.onPeersUpdateCallbacks.delete(callback);
    };
  }

  public onStatusChange(callback: (status: 'disconnected' | 'connecting' | 'connected' | 'error', errorMsg?: string) => void): () => void {
    this.onConnectionStatusCallbacks.add(callback);
    return () => {
      this.onConnectionStatusCallbacks.delete(callback);
    };
  }

  private notifyPeers() {
    const peerList = Array.from(this.activePeers.values());
    this.onPeersUpdateCallbacks.forEach((cb) => cb(peerList));
  }

  private notifyStatus(status: 'disconnected' | 'connecting' | 'connected' | 'error', errorMsg?: string) {
    this.onConnectionStatusCallbacks.forEach((cb) => cb(status, errorMsg));
  }
}

// Global Singleton for session voice chat
export const voiceManager = new WebRTCVoiceManager();
