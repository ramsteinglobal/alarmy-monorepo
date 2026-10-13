package com.alarmyapp

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AudioPlayerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var mediaPlayer: MediaPlayer? = null

    override fun getName(): String = "NativeAudioPlayer"

    @ReactMethod
    fun playRawSound(soundName: String, promise: Promise) {
        try {
            stopSoundInternal()
            val cleanName = soundName.replace(".wav", "").replace(".mp3", "")
            val resId = reactContext.resources.getIdentifier(
                cleanName,
                "raw",
                reactContext.packageName
            )
            if (resId == 0) {
                promise.reject("ERR_NOT_FOUND", "Sound not found in res/raw: $cleanName")
                return
            }

            mediaPlayer = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                val afd = reactContext.resources.openRawResourceFd(resId)
                setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                afd.close()
                prepare()
                start()
                setOnCompletionListener {
                    stopSoundInternal()
                }
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_PLAYBACK", e.message, e)
        }
    }

    @ReactMethod
    fun playUri(uriString: String, promise: Promise) {
        try {
            stopSoundInternal()
            val uri = Uri.parse(uriString)
            mediaPlayer = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                setDataSource(reactContext, uri)
                prepare()
                start()
                setOnCompletionListener {
                    stopSoundInternal()
                }
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_PLAYBACK", e.message, e)
        }
    }

    @ReactMethod
    fun stopSound(promise: Promise) {
        stopSoundInternal()
        promise.resolve(true)
    }

    @ReactMethod
    fun getSystemRingtones(promise: Promise) {
        try {
            val manager = RingtoneManager(reactContext)
            manager.setType(RingtoneManager.TYPE_ALARM)
            val cursor = manager.cursor
            val list = Arguments.createArray()

            while (cursor.moveToNext()) {
                val title = cursor.getString(RingtoneManager.TITLE_COLUMN_INDEX)
                val uri = manager.getRingtoneUri(cursor.position)?.toString() ?: ""
                val map = Arguments.createMap()
                map.putString("title", title)
                map.putString("uri", uri)
                list.pushMap(map)
            }
            promise.resolve(list)
        } catch (e: Exception) {
            promise.reject("ERR_RINGTONES", e.message, e)
        }
    }

    private fun stopSoundInternal() {
        try {
            mediaPlayer?.let {
                if (it.isPlaying) {
                    it.stop()
                }
                it.reset()
                it.release()
            }
        } catch (_: Exception) {
        } finally {
            mediaPlayer = null
        }
    }

    override fun invalidate() {
        super.invalidate()
        stopSoundInternal()
    }
}
