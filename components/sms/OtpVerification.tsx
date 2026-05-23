'use client';

import { useState, useEffect } from 'react';
import { KeyRound, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOtpVerification } from '@/hooks/useSms';

interface Props {
  phone: string;
  onVerified?: () => void;
}

export default function OtpVerification({ phone, onVerified }: Props) {
  const { otpSent, verified, sending, error, sendOtp, verifyOtp, reset } = useOtpVerification(phone);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!countdown) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    const ok = await sendOtp();
    if (ok) setCountdown(300);
  };

  const handleVerify = async () => {
    const ok = await verifyOtp(code.join(''));
    if (ok) onVerified?.();
  };

  const handleCodeChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const newCode = [...code];
    newCode[i] = val;
    setCode(newCode);
    if (val && i < 5) {
      const next = document.getElementById(`otp-${i + 1}`);
      next?.focus();
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      const prev = document.getElementById(`otp-${i - 1}`);
      prev?.focus();
    }
  };

  if (verified) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-500" />
          <div>
            <p className="font-medium text-green-800">Telefon raqam tasdiqlandi</p>
            <p className="text-sm text-green-600">{phone}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Telefon raqamni tasdiqlash</h3>
        </div>

        <p className="text-sm text-gray-500">{phone} raqamiga kod yuboriladi</p>

        {!otpSent ? (
          <Button onClick={handleSendOtp} disabled={sending} className="w-full">
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Kod yuborish
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {code.map((digit, i) => (
                <Input
                  key={i}
                  id={`otp-${i}`}
                  value={digit}
                  onChange={e => handleCodeChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold"
                  maxLength={1}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <Button onClick={handleVerify} disabled={code.join('').length !== 6 || sending} className="w-full">
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Tasdiqlash
            </Button>

            <div className="text-center">
              {countdown > 0 ? (
                <span className="text-sm text-gray-500 flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" /> {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')} qoldi
                </span>
              ) : (
                <Button variant="link" size="sm" onClick={handleSendOtp} disabled={sending}>
                  Qayta yuborish
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
