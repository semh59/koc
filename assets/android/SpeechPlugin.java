package com.neowell.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;

/** Rehberli mod sesli komutu. Android WebView'de speechSynthesis ses çıkarmıyor; yerel TextToSpeech kullanılır.
 *  Motor ya da ses yoksa hata verilmez, spoken:false döner ve uygulama sessiz devam eder. */
@CapacitorPlugin(name = "Speech")
public class SpeechPlugin extends Plugin {
    private static final AudioAttributes ATTRS = new AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
        .build();
    private TextToSpeech tts;
    private volatile boolean ready;
    private volatile boolean turkish;
    private volatile String lastId = "";
    private int seq;
    private AudioManager am;
    private Object focusReq; // AudioFocusRequest, API 26+
    private final AudioManager.OnAudioFocusChangeListener focusListener = change -> {};

    @Override
    public void load() {
        am = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        // onInit asenkron gelir; motor bağlanamazsa kurucunun içinde ERROR ile çağrılabilir, o yolda tts alanına dokunulmaz.
        tts = new TextToSpeech(getContext(), status -> {
            if (status != TextToSpeech.SUCCESS || tts == null) return;
            Locale tr = Locale.forLanguageTag("tr-TR");
            if (tts.isLanguageAvailable(tr) >= TextToSpeech.LANG_AVAILABLE) turkish = tts.setLanguage(tr) >= TextToSpeech.LANG_AVAILABLE;
            tts.setAudioAttributes(ATTRS);
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) {}
                @Override public void onDone(String id) { release(id); }
                @Override public void onError(String id) { release(id); }
                @Override public void onStop(String id, boolean interrupted) { release(id); }
            });
            ready = true;
        });
    }

    /** Sırayla gelen komutlarda yalnız son söz bitince odak bırakılır; araya giren eski söz müziği erken açmasın. */
    private void release(String id) {
        if (lastId.equals(id)) abandonFocus();
    }

    private void requestFocus() {
        if (am == null) return;
        if (Build.VERSION.SDK_INT >= 26) {
            if (focusReq == null) focusReq = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                .setAudioAttributes(ATTRS).setOnAudioFocusChangeListener(focusListener).build();
            am.requestAudioFocus((AudioFocusRequest) focusReq);
        } else {
            am.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK);
        }
    }

    private void abandonFocus() {
        if (am == null) return;
        if (Build.VERSION.SDK_INT >= 26) {
            if (focusReq != null) am.abandonAudioFocusRequest((AudioFocusRequest) focusReq);
        } else {
            am.abandonAudioFocus(focusListener);
        }
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        JSObject r = new JSObject();
        boolean ok = false;
        if (ready && text != null && !text.isEmpty()) {
            String id = "nw" + (++seq);
            lastId = id;
            requestFocus();
            ok = tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, id) == TextToSpeech.SUCCESS;
            if (!ok) abandonFocus();
        }
        r.put("spoken", ok);
        call.resolve(r);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (ready) tts.stop();
        abandonFocus();
        call.resolve();
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject r = new JSObject();
        r.put("available", ready);
        r.put("turkish", turkish);
        call.resolve(r);
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) tts.shutdown();
        abandonFocus();
    }
}
