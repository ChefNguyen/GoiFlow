package com.goiflow.util;

import java.util.HashMap;
import java.util.Map;

public class ShiritoriKanaUtils {

    private static final Map<Character, Character> SMALL_TO_BIG_KANA = new HashMap<>();
    private static final Map<Character, Character> KATAKANA_TO_HIRAGANA = new HashMap<>();

    static {
        // Small kana mappings
        SMALL_TO_BIG_KANA.put('ぁ', 'あ');
        SMALL_TO_BIG_KANA.put('ぃ', 'い');
        SMALL_TO_BIG_KANA.put('ぅ', 'う');
        SMALL_TO_BIG_KANA.put('ぇ', 'え');
        SMALL_TO_BIG_KANA.put('ぉ', 'お');
        SMALL_TO_BIG_KANA.put('ゃ', 'や');
        SMALL_TO_BIG_KANA.put('ゅ', 'ゆ');
        SMALL_TO_BIG_KANA.put('ょ', 'よ');
        SMALL_TO_BIG_KANA.put('っ', 'つ');
        SMALL_TO_BIG_KANA.put('ァ', 'あ');
        SMALL_TO_BIG_KANA.put('ィ', 'い');
        SMALL_TO_BIG_KANA.put('ゥ', 'う');
        SMALL_TO_BIG_KANA.put('ェ', 'え');
        SMALL_TO_BIG_KANA.put('ォ', 'お');
        SMALL_TO_BIG_KANA.put('ャ', 'や');
        SMALL_TO_BIG_KANA.put('ュ', 'ゆ');
        SMALL_TO_BIG_KANA.put('ョ', 'よ');
        SMALL_TO_BIG_KANA.put('ッ', 'つ');

        // Katakana to Hiragana conversion range
        for (char c = 'ァ'; c <= 'ヶ'; c++) {
            char hira = (char) (c - 0x60);
            KATAKANA_TO_HIRAGANA.put(c, hira);
        }
    }

    /**
     * Converts Katakana to Hiragana.
     */
    public static String toHiragana(String text) {
        if (text == null) return "";
        StringBuilder sb = new StringBuilder();
        for (char c : text.trim().toCharArray()) {
            sb.append(KATAKANA_TO_HIRAGANA.getOrDefault(c, c));
        }
        return sb.toString();
    }

    /**
     * Extracts the target starting kana of a word (first kana normalized to Hiragana).
     */
    public static String getFirstKana(String readingOrTerm) {
        String hira = toHiragana(readingOrTerm);
        if (hira.isEmpty()) return "";
        char firstChar = hira.charAt(0);
        return String.valueOf(SMALL_TO_BIG_KANA.getOrDefault(firstChar, firstChar));
    }

    /**
     * Extracts the target ending kana of a word following Shiritori rules.
     */
    public static String getLastKana(String readingOrTerm) {
        String hira = toHiragana(readingOrTerm);
        if (hira.isEmpty()) return "";

        int len = hira.length();
        char lastChar = hira.charAt(len - 1);

        // Handle long vowel mark 'ー'
        if (lastChar == 'ー' || lastChar == '-') {
            if (len > 1) {
                char prev = hira.charAt(len - 2);
                lastChar = resolveLongVowel(prev);
            }
        }

        // Convert small kana to full kana (e.g. ゃ -> や)
        lastChar = SMALL_TO_BIG_KANA.getOrDefault(lastChar, lastChar);

        return String.valueOf(lastChar);
    }

    /**
     * Checks if a word ends with the losing character 'ん' or 'ン'.
     */
    public static boolean endsWithN(String readingOrTerm) {
        String hira = toHiragana(readingOrTerm);
        if (hira.isEmpty()) return false;
        return hira.endsWith("ん");
    }

    /**
     * Resolves the vowel for a prolonged sound mark 'ー'.
     */
    private static char resolveLongVowel(char prev) {
        String s = String.valueOf(prev);
        if ("あかさたなはまやらわがざだばぱ".contains(s)) return 'あ';
        if ("いきしちにひみりぎじぢびぴ".contains(s)) return 'い';
        if ("うくすつぬふむゆるぐずづぶぷ".contains(s)) return 'う';
        if ("えけせてねへめれげぜでべぺ".contains(s)) return 'え';
        if ("おこそとのほもよろをごぞどぼぽ".contains(s)) return 'お';
        return prev;
    }

    /**
     * Checks if startKana matches expectedKana (handles both normalized and direct match).
     */
    public static boolean matchesKana(String candidateKana, String expectedKana) {
        if (candidateKana == null || expectedKana == null) return false;
        String c1 = getFirstKana(candidateKana);
        String c2 = getFirstKana(expectedKana);
        return c1.equalsIgnoreCase(c2);
    }
}
