'use client';
import { useEffect } from 'react';
import { toast } from 'sonner';
export default function ToastTest() {
  useEffect(() => { const t = setTimeout(() => {
    toast.success('Telegram connected', { duration: Infinity });
    toast.error('This is not a content-writing prompt, so it was not enhanced.', { duration: Infinity });
    toast.info('Tap "Start" in Telegram to finish connecting.', { duration: Infinity });
  }, 800); return () => clearTimeout(t); }, []);
  return <div className="p-4">toast test</div>;
}
