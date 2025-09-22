'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCam, setShowCam] = useState<boolean>(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  const onStartStream = async () => {
    setShowCam(true);
    const streamOptions: MediaStreamConstraints = {
      video: {
        deviceId: { exact: selectedDevice },
      },
    };
    const needlyStream = await navigator.mediaDevices.getUserMedia(streamOptions);
    if (needlyStream) {
      console.log(needlyStream);
      if (videoRef.current) {
        console.warn(1);
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

    //TODO логика прекращения стриминга и мб вывода результатов
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

  useEffect(() => {
    onGetDevices();
  }, []);

  return (
    <div className="font-mono flex items-center justify-center w-[100%] h-a p-8">
      {!showCam ? (
        <div className="flex flex-col gap-4">
          {devices.length ? (
            <Select value={selectedDevice} onValueChange={(value) => setSelectedDevice(value)}>
              <SelectTrigger className="w-[260px]">
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
            <Button onClick={() => onStartStream()} className="cursor-pointer">
              Начать тренировку
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', maxWidth: '600px' }}
          />

          <Button onClick={() => onStopStream()} className="cursor-pointer w-min">
            Остановить тренировку
          </Button>
        </div>
      )}
    </div>
  );
}
