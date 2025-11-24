class PeerService {
  constructor() {
    this.createPeer();
  }

  createPeer() {
    this.peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    });
  }

  async getOffer() {
    if (!this.peer || this.peer.signalingState === "closed") {
      this.createPeer(); // recreate peer if closed
    }

    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    return offer;
  }

  async getAnswer(offer) {
    if (!this.peer || this.peer.signalingState === "closed") {
      this.createPeer();
    }

    await this.peer.setRemoteDescription(offer);
    const ans = await this.peer.createAnswer();
    await this.peer.setLocalDescription(ans);
    return ans;
  }

  async setLocalDescription(ans) {
    if (!this.peer || this.peer.signalingState === "closed") {
      this.createPeer();
    }

    await this.peer.setRemoteDescription(ans);
  }

  hangUp() {
    if (this.peer) {
      this.peer.getSenders().forEach((sender) => {
        if (sender.track) sender.track.stop();
      });

      this.peer.close();
      this.peer = null;

      // recreate for next call
      this.createPeer();
    }
  }
}

export default new PeerService();
