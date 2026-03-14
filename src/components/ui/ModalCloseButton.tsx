import { X } from 'lucide-react';
import './ModalCloseButton.css';

interface Props {
    onClose: () => void;
    className?: string;
}

export function ModalCloseButton({ onClose, className = '' }: Props) {
    return (
        <button
            type="button"
            className={`modal-close-btn ${className}`}
            onClick={onClose}
            aria-label="Fechar modal"
        >
            <X size={16} />
        </button>
    );
}
