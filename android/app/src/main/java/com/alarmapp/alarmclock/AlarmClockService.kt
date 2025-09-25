package com.alarmapp.alarmclock

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.content.pm.ServiceInfo
import androidx.core.app.NotificationCompat
import com.alarmapp.AlarmActivity
import com.alarmapp.R
import android.os.PowerManager
import android.os.Handler
import android.os.Looper

class AlarmClockService : Service() {
  private val channelId = "alarm-silent"
  private var mediaPlayer: MediaPlayer? = null
  private var audioManager: AudioManager? = null
  private var focusRequest: AudioFocusRequest? = null
  private var wakeLock: PowerManager.WakeLock? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val title = intent?.getStringExtra("title") ?: "Alarm"
    val id = intent?.getStringExtra("id") ?: System.currentTimeMillis().toString()
    if (intent?.action == "STOP") {
      try { mediaPlayer?.stop(); mediaPlayer?.release() } catch (_: Exception) {}
      mediaPlayer = null
      try { wakeLock?.release() } catch (_: Exception) {}
      wakeLock = null
      stopForeground(true)
      stopSelf()
      return START_NOT_STICKY
    }

    ensureChannel()

    // Intent for opening app (MainActivity) when user taps the notification
    val openAppIntent = Intent(this, com.alarmapp.MainActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    }
    val contentPending = PendingIntent.getActivity(
      this, 0, openAppIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0
    )

    val stopIntent = Intent(this, AlarmClockService::class.java).apply { action = "STOP" }
    val stopPending = PendingIntent.getService(
      this, 1, stopIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0
    )

    val notif: Notification = NotificationCompat.Builder(this, channelId)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle("\uD83D\uDEA8 ALARM")
      .setContentText(title)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
      .setOngoing(true)
      .setAutoCancel(false)
      // Do not launch full-screen when device is locked; user will tap notification
      .setContentIntent(contentPending)
      .addAction(R.mipmap.ic_launcher, "Stop", stopPending)
      .build()

    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        startForeground(1201, notif, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
      } else {
        startForeground(1201, notif)
      }
    } catch (_: Exception) { /* ignore */ }

    // Acquire a short wake lock to help turn on screen for older devices
    try {
      val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
      @Suppress("DEPRECATION")
      val wl = pm.newWakeLock(
        PowerManager.SCREEN_DIM_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
        "AlarmApp:AlarmWakeLock",
      )
      wl.acquire(15000)
      wakeLock = wl
    } catch (_: Exception) {}

    // Do not auto-launch any activity. Let the notification + ringtone bring attention
    // Acquire partial wakelock to keep CPU on while screen may be off
    try {
      val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
      val wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "AlarmApp:AlarmCpuLock")
      wl.acquire(60000)
    } catch (_: Exception) {}

    startRinging()
    return START_NOT_STICKY
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      val channel = NotificationChannel(channelId, "Alarms (Silent)", NotificationManager.IMPORTANCE_HIGH).apply {
        description = "Silent alarm visual notifications"
        setSound(null, null)
        enableVibration(false)
        enableLights(false)
        setBypassDnd(true)
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      }
      nm.createNotificationChannel(channel)
    }
  }

  private fun startRinging() {
    try {
      audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
      val attrs = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        focusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
          .setAudioAttributes(attrs)
          .setOnAudioFocusChangeListener { }
          .build()
        audioManager?.requestAudioFocus(focusRequest!!)
      } else {
        @Suppress("DEPRECATION")
        audioManager?.requestAudioFocus(null, AudioManager.STREAM_ALARM, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
      }

      // Ensure alarm stream is audible when device is locked
      try {
        val current = audioManager?.getStreamVolume(AudioManager.STREAM_ALARM) ?: 0
        if (current == 0) {
          val max = audioManager?.getStreamMaxVolume(AudioManager.STREAM_ALARM) ?: 7
          @Suppress("DEPRECATION")
          audioManager?.setStreamVolume(
            AudioManager.STREAM_ALARM,
            (max * 0.7).toInt().coerceAtLeast(1),
            0,
          )
        }
      } catch (_: Exception) {}
      val alarmUri: Uri =
        RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
          ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
          ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
      mediaPlayer = MediaPlayer().apply {
        setAudioAttributes(attrs)
        setDataSource(this@AlarmClockService, alarmUri)
        setWakeMode(this@AlarmClockService, PowerManager.PARTIAL_WAKE_LOCK)
        isLooping = true
        prepare()
        try { audioManager?.mode = AudioManager.MODE_NORMAL } catch (_: Exception) {}
        try { setVolume(1.0f, 1.0f) } catch (_: Exception) {}
        start()
      }
    } catch (_: Exception) {}
  }

  // No onStart override; STOP handled in onStartCommand
}


