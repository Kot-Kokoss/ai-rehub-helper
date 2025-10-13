'use client';

import io, { Socket } from 'socket.io-client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket>(null);
  const pcRef = useRef<RTCPeerConnection>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCam, setShowCam] = useState<boolean>(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onStartStream = async () => {
    setShowCam(true);
    const streamOptions: MediaStreamConstraints = {
      video: {
        deviceId: { exact: selectedDevice },
      },
    };
    const needlyStream = await navigator.mediaDevices.getUserMedia(streamOptions);
    if (needlyStream) {
      if (videoRef.current) {
        videoRef.current.srcObject = needlyStream;
        videoRef.current.play().catch((err) => {
          console.log('Автовоспроизведение заблокировано:', err);
        });
      }
      setStream(needlyStream);
    }
  };

  const onStopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setShowCam(false);
    }
  };

  const onGetDevices = async () => {
    await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    const mediaDevices = (await navigator.mediaDevices.enumerateDevices()).filter(
      (el) => el.kind === 'videoinput',
    );
    if (Array.isArray(mediaDevices) && mediaDevices.length) {
      setDevices(mediaDevices);

      if (mediaDevices.length === 1) {
        setSelectedDevice(mediaDevices[0].deviceId);
      }
    }
  };

  const onStartRecord = () => {};

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);

    // TODO добавить проверку размера и типа файла
    // TODO добавить тост уведомления
  };

  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      setSelectedFile(null);
    }
  };

  const initWebRTC = async () => {
    socketRef.current = io('http://localhost:3000');
    socketRef.current.emit('join-stream', 'ml-stream');

    pcRef.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    stream?.getTracks().forEach((track) => {
      pcRef.current?.addTrack(track, stream);
    });

    pcRef.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Обработка ICE кандидатов
    pcRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          streamId: 'ml-stream',
        });
      }
    };

    // Сигнальные сообщения
    socketRef.current.on('offer', async (data) => {
      await pcRef.current.setRemoteDescription(data.offer);
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);

      if (!socketRef.current) return;
      socketRef.current.emit('answer', {
        answer: answer,
        streamId: 'ml-stream',
      });
    });

    socketRef.current.on('answer', async (data) => {
      await pcRef.current.setRemoteDescription(data.answer);
    });

    socketRef.current.on('ice-candidate', async (data) => {
      await pcRef.current.addIceCandidate(data.candidate);
    });

    // Создаем офер
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);

    socketRef.current.emit('offer', {
      offer: offer,
      streamId: 'ml-stream',
    });
  };

  useEffect(() => {
    onGetDevices();

    setIsLoading(false);
  }, []);

  useEffect(() => {
    // initWebRTC();

    return () => {
      if (pcRef.current) pcRef.current.close();
      if (socketRef.current) socketRef.current.disconnect();
    };
  });

  return (
    <div className="font-mono flex items-center justify-center w-full h-[calc(100vh-4rem)] p-8">
      {isLoading ? (
        <Spinner className="size-10" />
      ) : (
        <>
          {!showCam ? (
            <div className="flex flex-col gap-4">
              {devices.length ? (
                <Select value={selectedDevice} onValueChange={(value) => setSelectedDevice(value)}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Выберите камеру" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((el) => (
                      <SelectItem value={el.deviceId} key={el.deviceId}>
                        {el.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex flex-col">
                  <p className="font-mono mb-2">Камера не обнаружена</p>
                  <Button onClick={() => onGetDevices()} className="cursor-pointer">
                    Запросить доступ
                  </Button>
                </div>
              )}

              {selectedDevice && (
                <div className="flex-row">
                  <Button onClick={() => onStartStream()} className="cursor-pointer mr-2">
                    Начать в реальном времени
                  </Button>

                  <Button onClick={() => onStartRecord()} className="cursor-pointer">
                    Записать видео
                  </Button>
                </div>
              )}

              <span>Или загрузите с устройства</span>

              <div className="grid w-full max-w-sm items-center gap-3">
                <Label htmlFor="video">Ваше видео</Label>
                <div className="flex">
                  <Input id="video" type="file" ref={fileInputRef} onChange={handleFileChange} />
                  {selectedFile && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="ml-2 cursor-pointer"
                      onClick={clearFileInput}
                    >
                      <X />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 h-full">
              <div className="flex flex-row items-center gap-4">
                <div>
                  <h4 className="mb-2">Исходный поток</h4>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', maxWidth: '600px' }}
                  />
                </div>

                <div>
                  <h4 className="mb-2">Обработанный поток</h4>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', maxWidth: '600px' }}
                  />
                </div>
              </div>

              <Button onClick={() => onStopStream()} className="cursor-pointer w-min">
                Остановить тренировку
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
