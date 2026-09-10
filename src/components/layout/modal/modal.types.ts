import type { ReactNode } from 'react';

export interface IModalProps {
	children: ReactNode;
	open: boolean;
	title: string;
	onClose: () => void;
}
