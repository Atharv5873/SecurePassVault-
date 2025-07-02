import { useEffect } from 'react';
import { pingServer } from '../lib/utils';

export const usePinger = () => {
    useEffect(() => {
        // Ping immediately
        pingServer();

        // Then every 10 minutes
        const interval = setInterval(() => {
            pingServer();
        }, 10 * 60 * 1000); // 10 minutes

        return () => clearInterval(interval);
    }, []);
};
