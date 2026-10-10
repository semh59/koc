package com.neowell.app;

import java.util.Map;

/** Step counter logic (no Android dependency, unit-testable). The sensor reports the total steps since the phone booted. */
final class StepMath {
    static final class State {
        String day = "";
        float base = 0, carry = 0, last = -1;
        /** The last reading was taken in the final minutes of the day (after SAMPLE_MINUTES): the day's total is known. */
        boolean sampled = false;
        /** The phone rebooted since the last reading (the counter was reset), even if the counter now exceeds the last value. */
        boolean rebooted = false;
        /** The boot count is known (it was also stored at the previous reading): a reboot is detected from it with certainty, and a falling counter alone does not count as a reboot. */
        boolean bootKnown = false;
    }

    /** 23:58 sampling alarm. Even if the midnight alarm is delayed by Doze, the steps up to this reading go to the finished day and the rest to the new day. */
    static final int SAMPLE_MINUTES = 23 * 60 + 58;

    /** More steps than this in one day are unrealistic: anything above it is a corrupt counter state. */
    static final long MAX_DAY = 60000;

    static long total(State s, float counter) {
        return Math.max(0L, Math.round((double) (s.carry + counter - s.base)));
    }

    /** When the boot count has not changed the counter cannot fall: a lower value is a stale or out-of-order reading and is ignored. Otherwise the next correct reading would add every step since boot to today. */
    private static float stable(State s, float counter) {
        return s.bootKnown && !s.rebooted && s.last >= 0 && counter < s.last ? s.last : counter;
    }

    /** After a reboot the counter restarts: the steps up to that moment move to carry. Applies when the counter fell below the last value, or when the reboot is known separately (rebooted). */
    private static void handleReboot(State s, float counter) {
        if (s.last >= 0 && (s.rebooted || (!s.bootKnown && counter < s.last))) {
            s.carry += Math.max(0, s.last - s.base);
            s.base = 0;
        }
        s.rebooted = false;
    }

    /** With a late alarm, the steps after midnight are written to the old day; without closing, the evening steps after the last reading would belong to no day.
     *  Until 06:00 few steps are taken; a later alarm is mostly morning steps, so the day is not closed then. */
    static final int MAX_LATE_MINUTES = 360;

    /** Night alarm: closes the finished day with the current reading and returns true if it closed one. */
    static boolean closeDay(State s, String today, float counter, int minutesSinceMidnight, Map<String, Long> history) {
        counter = stable(s, counter);
        if (s.day.isEmpty() || s.day.equals(today)) return false;
        if (s.sampled) {
            update(s, today, counter, minutesSinceMidnight, history);
            return true;
        }
        if (minutesSinceMidnight > MAX_LATE_MINUTES) return false;
        handleReboot(s, counter);
        history.put(s.day, total(s, counter));
        s.day = "";
        return true;
    }

    /** Processes a new reading and returns today's step count. If the day changed and the night alarm was missed, the steps up to the last reading go to the old day; if the last reading was the 23:58 sample, what follows counts for the new day.
     *  Without a sample, a reading before 06:00 also writes the steps since the last reading to the old day (same rule as closeDay); a later reading cannot know the day of that gap, so it is not estimated and the new day starts from the counter. */
    static long update(State s, String today, float counter, int minutesSinceMidnight, Map<String, Long> history) {
        counter = stable(s, counter);
        if (!s.day.equals(today)) {
            if (!s.day.isEmpty()) {
                if (!s.sampled && minutesSinceMidnight <= MAX_LATE_MINUTES) {
                    handleReboot(s, counter);
                    history.put(s.day, total(s, counter));
                } else {
                    history.put(s.day, total(s, s.last));
                }
            }
            s.day = today;
            s.carry = 0;
            if (s.sampled) {
                s.base = s.last;
                handleReboot(s, counter);
            } else {
                s.base = counter;
            }
        } else {
            handleReboot(s, counter);
        }
        s.rebooted = false;
        s.last = counter;
        s.sampled = minutesSinceMidnight >= SAMPLE_MINUTES;
        return total(s, counter);
    }
}
