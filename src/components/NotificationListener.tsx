import React, { useEffect, useRef, useState } from 'react';
import localDb from '../lib/localDb';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { useLiveQuery } from 'dexie-react-hooks';

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export function NotificationListener() {
  const { profile } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastProcessedTime = useRef<number>(Date.now());
  const processedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
  }, []);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.error('Error playing notification sound:', err));
    }
  };

  const notifications = useLiveQuery(async () => {
    if (!profile) return [];
    
    // Fetch notifications depending on role
    let notifs: any[] = [];
    if (profile.role === 'super_admin') {
      notifs = await localDb.notifications
        .where('targetRole')
        .equals('super_admin')
        .toArray();
    } else if (profile.role === 'anggota') {
      notifs = await localDb.notifications
        .where('targetUserId')
        .equals(profile.uid)
        .toArray();
    } else if (profile.koperasiId) {
      notifs = await localDb.notifications
        .where('koperasiId')
        .equals(profile.koperasiId)
        .toArray();
    }
    
    return notifs;
  }, [profile]);

  useEffect(() => {
    if (!notifications) return;
    
    notifications.forEach((notif) => {
      if (!notif.createdAt) return;
      
      const createdAtMs = new Date(notif.createdAt).getTime();
      const notifId = notif.id?.toString() || '';
      
      if (createdAtMs > lastProcessedTime.current && !processedIds.current.has(notifId)) {
        processedIds.current.add(notifId);
        playSound();
        toast.success(`${notif.title}: ${notif.message}`, {
          duration: 5000,
          position: 'top-right',
        });
      }
    });
  }, [notifications]);

  return null;
}
