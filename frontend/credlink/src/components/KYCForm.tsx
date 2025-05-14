import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PinataSDK } from 'pinata';


export default function KYCForm({ signer }) {
  const [idDoc, setIdDoc] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [preview, setPreview] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT!,
    pinataGateway: "aquamarine-immense-newt-802.mypinata.cloud",
  });

  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [link, setLink] = useState('')


  const startCamera = async () => {
    setCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera error:", err);
      setStatus("❌ Cannot access camera.");
    }
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      setSelfie(blob);
      setPreview(URL.createObjectURL(blob));
      stopCamera();
    }, "image/jpeg");
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setCapturing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idDoc || !selfie) {
      setStatus("❌ Please provide both ID and selfie.");
      return;
    }

    try {
      setLoading(true);
      setStatus("📡 Uploading...");

      const address = await signer.getAddress();

      const formData = new FormData();
      formData.append("wallet", address);
      formData.append("idDocument", idDoc);
      formData.append("selfie", selfie);

      const upload = await pinata.upload.public.file(file);
      if (upload.cid) {
        setUploadStatus('File uploaded successfully!')
        const ipfsLink = await pinata.gateways.public.convert(upload.cid)
        setLink(ipfsLink)
      } else {
        setUploadStatus('Upload failed')
      }

      // Simulate upload
      console.log("Uploading for:", address);
      console.log("ID:", idDoc);
      console.log("Selfie:", selfie);

      setTimeout(() => {
        setStatus("✅ KYC documents submitted!");
        setLoading(false);
        navigate('/loan-request');
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatus("❌ Submission failed");
      setLoading(false);
      navigate('/loan-request');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-lg space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-800">KYC Verification</h2>

      <div>
        <label className="block text-gray-700 font-medium mb-1">Upload ID Document</label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setIdDoc(e.target.files[0])}
          className="block w-full border p-2 rounded"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-1">Selfie / Liveness</label>

        {!capturing && !preview && (
          <div className="flex gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="border p-2 rounded w-full"
            />
            <button
              type="button"
              onClick={startCamera}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Use Camera
            </button>
          </div>
        )}

        {capturing && (
          <div className="space-y-2">
            <video ref={videoRef} autoPlay playsInline className="rounded-lg shadow w-full max-w-sm" />
            <button
              type="button"
              onClick={captureSelfie}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Capture Selfie
            </button>
          </div>
        )}

        {preview && (
          <div className="mt-2">
            <p className="text-sm text-green-600">✅ Selfie captured</p>
            <img src={preview} alt="Selfie preview" className="w-32 h-32 object-cover rounded shadow" />
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-700 text-white py-3 px-4 rounded-xl hover:bg-blue-800 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit KYC"}
      </button>

      {status && <p className="text-sm mt-2 text-center">{status}</p>}
    </form>
  );
}
