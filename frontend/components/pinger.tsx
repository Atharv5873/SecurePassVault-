'use client';

import { usePinger } from "@/hooks/Pinger";

export default function PingerClientWrapper() {
    usePinger();
    return null;
}
