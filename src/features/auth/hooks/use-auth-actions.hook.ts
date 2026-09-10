import { showErrorNotification } from '@td/components/ui/notification/notification.helper';
import { useAuth } from '@td/providers/auth/auth.hook';
import { useRef, useState } from 'react';
import type { IRegisterFormValues } from '../forms/register/register.form.types';
import { getAuthErrorMessage, validateAuthValues } from '../utils/auth.util';

export const useAuthActions = (mode: 'signIn' | 'signUp') => {
	const { signIn, signUp, sendEmailVerification } = useAuth();
	const pending = useRef(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const submit = async (values: Partial<IRegisterFormValues>) => {
		if (pending.current) return;
		const validationError = validateAuthValues(values, mode);
		setError(validationError);
		if (validationError) return;
		pending.current = true;
		setIsSubmitting(true);
		try {
			const credentials = {
				email: (values.email ?? '').trim(),
				password: values.password ?? '',
			};
			if (mode === 'signIn') {
				await signIn(credentials);
			} else {
				await signUp(credentials);
				// Account creation succeeds even if delivery fails; the confirmation screen allows retrying.
				try {
					await sendEmailVerification();
				} catch {
					showErrorNotification(
						'Your account was created, but the confirmation email could not be sent. Please request another email on the confirmation screen.',
					);
				}
			}
		} catch (cause) {
			setError(getAuthErrorMessage(cause));
		} finally {
			pending.current = false;
			setIsSubmitting(false);
		}
	};
	return { submit, isSubmitting, error };
};
