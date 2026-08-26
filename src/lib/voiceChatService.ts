import { doc, setDoc, onSnapshot, deleteDoc, collection } from 'firebase/firestore';
import { db } from './firebase';
import { eventBus } from '../events/eventBus';

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
  iceStatus?: string;
}

export interface VoiceSignalData {
  id: string; // senderUid_receiverUid_timestamp
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
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' }
  ],
  iceCandidatePoolSize: 10
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
  private localAnalyser: AnalyserNode | null = null;
  private speechInterval: number | null = null;

  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private pendingIceCandidates: Map<string, RTCIceCandidateInit[]> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private remoteGainNodes: Map<string, GainNode> = new Map();
  private remoteAnalysers: Map<string, AnalyserNode> = new Map();
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

  private ensureAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
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
    this.ensureAudioContext();

    try {
      // Get user audio media stream with echo cancellation and auto gain
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
        this.notifyStatus('error', 'Microphone access was denied or no input device found.');
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
      const ctx = this.ensureAudioContext();
      if (!ctx) return;

      const source = ctx.createMediaStreamSource(this.localStream);
      this.localAnalyser = ctx.createAnalyser();
      this.localAnalyser.fftSize = 256;
      source.connect(this.localAnalyser);

      const dataArray = new Uint8Array(this.localAnalyser.frequencyBinCount);

      if (this.speechInterval) window.clearInterval(this.speechInterval);

      this.speechInterval = window.setInterval(() => {
        if (!this.localAnalyser || this.isMuted || this.isDeafened || (this.isPushToTalk && !this.pttPressed)) {
          if (this.isSpeaking) {
            this.isSpeaking = false;
            this.publishLocalPresence();
          }
          return;
        }

        this.localAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const nowSpeaking = average > 14; // Sensitive threshold for speaking indication

        if (nowSpeaking !== this.isSpeaking) {
          this.isSpeaking = nowSpeaking;
          this.publishLocalPresence();
        }
      }, 120);
    } catch (e) {
      console.warn('Could not setup Audio Context analyser:', e);
    }
  }

  /**
   * Publish or update local presence in Firestore / Local Broadcast
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
      try {
        this.broadcastChannel.postMessage({ type: 'VOICE_PEER_UPDATE', state, sessionCode: this.sessionCode });
      } catch (e) {}
    }

    // Sync to Firestore
    try {
      const peerDocRef = doc(db, 'sessions', this.sessionCode, 'voice_peers', this.localUid);
      await setDoc(peerDocRef, state, { merge: true });
    } catch (e) {
      // Ignore transient errors
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
          snapshot.forEach((d) => {
            const data = d.data() as VoicePeerState;
            if (data && data.uid) {
              this.activePeers.set(data.uid, data);
              // If remote peer found and no connection exists yet, initiate connection
              if (data.uid !== this.localUid) {
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
            if (state.uid !== this.localUid) {
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
    if (!this.pendingIceCandidates.has(remoteUid)) {
      this.pendingIceCandidates.set(remoteUid, []);
    }

    // Add local tracks to connection
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming remote audio stream track
    pc.ontrack = (event) => {
      const remoteStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
      this.remoteStreams.set(remoteUid, remoteStream);
      this.playRemoteAudioStream(remoteUid, remoteStream);
    };

    // ICE candidate generation with plain object serialization
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidatePayload = {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          usernameFragment: (event.candidate as any).usernameFragment || null
        };
        this.sendSignal(remoteUid, 'ice-candidate', candidatePayload);
      }
    };

    // ICE connection state monitoring & recovery
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      const peer = this.activePeers.get(remoteUid);
      if (peer) {
        peer.iceStatus = state;
        this.notifyPeers();
      }

      if (state === 'failed' || state === 'disconnected') {
        console.warn(`[WebRTC] Voice connection to ${remoteUid} is ${state}. Attempting ICE renegotiation...`);
        if (this.localUid > remoteUid) {
          pc.createOffer({ iceRestart: true })
            .then(offer => pc.setLocalDescription(offer))
            .then(() => {
              if (pc.localDescription) {
                this.sendSignal(remoteUid, 'offer', {
                  type: pc.localDescription.type,
                  sdp: pc.localDescription.sdp
                });
              }
            })
            .catch(e => console.warn('ICE restart offer failed:', e));
        }
      }
    };

    // Asymmetric offer generation: the peer with alphabetically greater UID sends offer
    if (this.localUid > remoteUid) {
      pc.createOffer({
        offerToReceiveAudio: true
      })
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          if (pc.localDescription) {
            this.sendSignal(remoteUid, 'offer', {
              type: pc.localDescription.type,
              sdp: pc.localDescription.sdp
            });
          }
        })
        .catch((err) => console.warn('Error creating WebRTC offer:', err));
    }
  }

  /**
   * Play remote audio stream with user specific volume control & Web Audio routing
   */
  private playRemoteAudioStream(remoteUid: string, stream: MediaStream) {
    try {
      let container = typeof document !== 'undefined' ? document.getElementById('webrtc-remote-audio-container') : null;
      if (!container && typeof document !== 'undefined') {
        container = document.createElement('div');
        container.id = 'webrtc-remote-audio-container';
        container.style.position = 'fixed';
        container.style.bottom = '0';
        container.style.left = '0';
        container.style.width = '1px';
        container.style.height = '1px';
        container.style.opacity = '0.01';
        container.style.pointerEvents = 'none';
        container.setAttribute('aria-hidden', 'true');
        document.body.appendChild(container);
      }

      let audioEl = this.remoteAudioElements.get(remoteUid);
      if (!audioEl) {
        audioEl = document.createElement('audio');
        audioEl.autoplay = true;
        audioEl.setAttribute('playsinline', 'true');
        audioEl.setAttribute('webkit-playsinline', 'true');
        audioEl.volume = this.userVolumes.get(remoteUid) ?? 1.0;
        this.remoteAudioElements.set(remoteUid, audioEl);
        if (container) {
          container.appendChild(audioEl);
        }
      }

      audioEl.srcObject = stream;
      audioEl.muted = this.isDeafened;
      
      const playPromise = audioEl.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn(`[WebRTC] Autoplay waiting for user gesture for ${remoteUid}:`, err);
        });
      }

      // Also route through Web Audio API for gain amplification and remote volume analysis
      const ctx = this.ensureAudioContext();
      if (ctx) {
        try {
          const source = ctx.createMediaStreamSource(stream);
          const gainNode = ctx.createGain();
          const userVol = this.userVolumes.get(remoteUid) ?? 1.0;
          gainNode.gain.value = this.isDeafened ? 0 : userVol;
          
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;

          source.connect(gainNode);
          gainNode.connect(analyser);
          gainNode.connect(ctx.destination);

          this.remoteGainNodes.set(remoteUid, gainNode);
          this.remoteAnalysers.set(remoteUid, analyser);
        } catch (e) {
          // Web Audio routing fallback
        }
      }
    } catch (e) {
      console.warn('Error in playRemoteAudioStream:', e);
    }
  }

  /**
   * Send WebRTC signaling message via Firestore & BroadcastChannel
   */
  private async sendSignal(receiverUid: string, type: 'offer' | 'answer' | 'ice-candidate', payload: any) {
    if (!this.sessionCode) return;
    const signalId = `${this.localUid}_${receiverUid}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    
    // Ensure payload is a clean, plain JSON object
    const cleanPayload = JSON.parse(JSON.stringify(payload));
    
    const signal: VoiceSignalData = {
      id: signalId,
      senderUid: this.localUid,
      receiverUid,
      type,
      payload: cleanPayload,
      createdAt: new Date().toISOString()
    };

    // 1. Broadcast locally
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: 'WEBRTC_SIGNAL', signal, sessionCode: this.sessionCode });
      } catch (e) {}
    }

    // 2. Save to Firestore
    try {
      const docRef = doc(db, 'sessions', this.sessionCode, 'voice_signals', signalId);
      await setDoc(docRef, signal);
    } catch (e) {
      console.warn('Could not post WebRTC signal to Firestore:', e);
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
              // Clean up signal after handling
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

    if (this.broadcastChannel) {
      this.broadcastChannel.addEventListener('message', async (event) => {
        if (event.data?.type === 'WEBRTC_SIGNAL' && event.data?.sessionCode === this.sessionCode) {
          const signal = event.data.signal as VoiceSignalData;
          if (signal && signal.receiverUid === this.localUid && signal.senderUid !== this.localUid) {
            await this.handleIncomingSignal(signal);
          }
        }
      });
    }
  }

  /**
   * Process incoming WebRTC Offer, Answer or ICE Candidate with queue handling
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
        const desc = new RTCSessionDescription({
          type: signal.payload.type,
          sdp: signal.payload.sdp
        });
        await pc.setRemoteDescription(desc);

        // Flush any queued ICE candidates for this sender
        const queued = this.pendingIceCandidates.get(senderUid) || [];
        this.pendingIceCandidates.set(senderUid, []);
        for (const cand of queued) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {}
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (pc.localDescription) {
          await this.sendSignal(senderUid, 'answer', {
            type: pc.localDescription.type,
            sdp: pc.localDescription.sdp
          });
        }
      } else if (signal.type === 'answer') {
        const desc = new RTCSessionDescription({
          type: signal.payload.type,
          sdp: signal.payload.sdp
        });
        await pc.setRemoteDescription(desc);

        // Flush any queued ICE candidates
        const queued = this.pendingIceCandidates.get(senderUid) || [];
        this.pendingIceCandidates.set(senderUid, []);
        for (const cand of queued) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {}
        }
      } else if (signal.type === 'ice-candidate') {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
          } catch (e) {
            console.warn('Failed to add immediate ICE candidate:', e);
          }
        } else {
          // Queue until remote description is ready
          const list = this.pendingIceCandidates.get(senderUid) || [];
          list.push(signal.payload);
          this.pendingIceCandidates.set(senderUid, list);
        }
      }
    } catch (err) {
      console.warn('Error handling WebRTC signal:', err);
    }
  }

  // ==========================================
  // CONTROLS & STATE MODIFIERS
  // ==========================================

  public resumeAudio() {
    this.ensureAudioContext();
    this.remoteAudioElements.forEach(el => {
      el.play().catch(() => {});
    });
  }

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
    this.remoteGainNodes.forEach((gainNode, uid) => {
      const vol = this.userVolumes.get(uid) ?? 1.0;
      gainNode.gain.value = this.isDeafened ? 0 : vol;
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
    const clamped = Math.max(0, Math.min(2, volume));
    this.userVolumes.set(uid, clamped);
    
    const audioEl = this.remoteAudioElements.get(uid);
    if (audioEl) {
      audioEl.volume = Math.min(1.0, clamped);
    }

    const gainNode = this.remoteGainNodes.get(uid);
    if (gainNode) {
      gainNode.gain.value = this.isDeafened ? 0 : clamped;
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
    this.pendingIceCandidates.clear();

    this.remoteAudioElements.forEach((audioEl) => {
      audioEl.pause();
      audioEl.srcObject = null;
      if (audioEl.parentElement) {
        audioEl.parentElement.removeChild(audioEl);
      }
    });
    this.remoteAudioElements.clear();
    this.remoteStreams.clear();
    this.remoteGainNodes.clear();
    this.remoteAnalysers.clear();

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

  public getActiveSpeakers(): VoicePeerState[] {
    return Array.from(this.activePeers.values()).filter((p) => p.isSpeaking);
  }

  private notifyPeers() {
    const peerList = Array.from(this.activePeers.values());
    this.onPeersUpdateCallbacks.forEach((cb) => cb(peerList));

    // Emit event bus notification for active speakers
    peerList.forEach((peer) => {
      eventBus.emit('VoiceSpeakerChanged', {
        uid: peer.uid,
        displayName: peer.displayName,
        characterName: peer.characterName,
        isSpeaking: peer.isSpeaking
      });
    });
  }

  private notifyStatus(status: 'disconnected' | 'connecting' | 'connected' | 'error', errorMsg?: string) {
    this.onConnectionStatusCallbacks.forEach((cb) => cb(status, errorMsg));
  }
}

// Global Singleton for session voice chat
export const voiceManager = new WebRTCVoiceManager();
