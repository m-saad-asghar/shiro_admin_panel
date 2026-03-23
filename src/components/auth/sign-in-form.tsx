'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { EyeSlashIcon } from '@phosphor-icons/react/dist/ssr/EyeSlash';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import { paths } from '@/paths';
import { useUser } from '@/hooks/use-user';
import type { AuthUser, LoginResponse } from '@/contexts/user-context';

const schema = zod.object({
  email: zod.string().min(1, { message: 'Email is required' }).email(),
  password: zod.string().min(1, { message: 'Password is required' }),
});

type Values = zod.infer<typeof schema>;
const defaultValues = { email: '', password: '' } satisfies Values;

function buildApiErrorMessage(data: LoginResponse | null, status: number): string {
  if (!data) return `Login failed (HTTP ${status})`;

  if (data.errors && Object.keys(data.errors).length) {
    const joined = Object.values(data.errors).flat().join(' ');
    if (joined.trim()) return joined;
  }
  if (data.message) return data.message;
  if (data.error) return data.error;

  return `Login failed (HTTP ${status})`;
}

export function SignInForm(): React.JSX.Element {
  const router = useRouter();
  const { signIn } = useUser();

  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [isPending, setIsPending] = React.useState<boolean>(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);

      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL;

        if (!base) {
          setError('root', { type: 'server', message: 'NEXT_PUBLIC_API_BASE_URL is missing.' });
          return;
        }

        const res = await fetch(`${base}/admin/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ email: values.email, password: values.password }),
        });

        let data: LoginResponse | null = null;
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          try {
            data = (await res.json()) as LoginResponse;
          } catch {
            data = null;
          }
        }

        if (!res.ok) {
          setError('root', { type: 'server', message: buildApiErrorMessage(data, res.status) });
          return;
        }

        if (!data) {
          setError('root', { type: 'server', message: 'Login succeeded but response is not JSON.' });
          return;
        }

        const token = data.access_token || data.token;
        if (!token) {
          setError('root', { type: 'server', message: 'Login succeeded but access_token is missing.' });
          return;
        }

        const user: AuthUser | null = data.user
          ? {
              id: data.user.id,
              first_name: data.user.first_name,
              last_name: data.user.last_name,
              email: data.user.email,
              profile_image: data.user.profile_image,
              roles: data.user.roles ?? [],
              permissions: data.user.permissions ?? [],
            }
          : null;

        // ✅ single source of truth: context handles localStorage too
        signIn({ token, user, raw: data });

        router.push('/dashboard/developers');
        router.refresh();
      } catch {
        setError('root', { type: 'server', message: 'Network error. Check API/CORS.' });
      } finally {
        setIsPending(false);
      }
    },
    [router, setError, signIn]
  );

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h4">Sign in</Typography>
      </Stack>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <FormControl error={Boolean(errors.email)}>
                <InputLabel>Email address</InputLabel>
                <OutlinedInput {...field} label="Email address" type="email" />
                {errors.email ? <FormHelperText>{errors.email.message}</FormHelperText> : null}
              </FormControl>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <FormControl error={Boolean(errors.password)}>
                <InputLabel>Password</InputLabel>
                <OutlinedInput
                  {...field}
                  endAdornment={
                    showPassword ? (
                      <EyeIcon cursor="pointer" fontSize="var(--icon-fontSize-md)" onClick={() => setShowPassword(false)} />
                    ) : (
                      <EyeSlashIcon cursor="pointer" fontSize="var(--icon-fontSize-md)" onClick={() => setShowPassword(true)} />
                    )
                  }
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                />
                {errors.password ? <FormHelperText>{errors.password.message}</FormHelperText> : null}
              </FormControl>
            )}
          />

          <div>
            <Link component={RouterLink} href={paths.auth.resetPassword} variant="subtitle2">
              Forgot password?
            </Link>
          </div>

          {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}

          <Button disabled={isPending} type="submit" variant="contained">
            Sign in
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}