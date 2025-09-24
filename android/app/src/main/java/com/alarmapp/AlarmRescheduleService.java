package com.alarmapp;

import android.content.Intent;
import android.os.IBinder;
import android.util.Log;
import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;

public class AlarmRescheduleService extends HeadlessJsTaskService {
    private static final String TAG = "AlarmRescheduleService";
    private static final String TASK_NAME = "AlarmRescheduleTask";

    @Override
    protected HeadlessJsTaskConfig getTaskConfig(Intent intent) {
        WritableMap config = Arguments.createMap();
        config.putString("action", "reschedule_alarms");
        return new HeadlessJsTaskConfig(TASK_NAME, config, 5000, true);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Starting alarm reschedule service...");
        try {
            return super.onStartCommand(intent, flags, startId);
        } catch (Exception e) {
            Log.e(TAG, "Error starting service: " + e.getMessage());
            return START_NOT_STICKY;
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
