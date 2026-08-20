package com.goiflow.util;

import java.util.UUID;

public class CuidUtils {
    public static String generate() {
        return "c" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
    }
}
