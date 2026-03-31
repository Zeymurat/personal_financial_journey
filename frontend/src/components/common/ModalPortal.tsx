import { createPortal } from 'react-dom';

type ModalPortalProps = {
  children: React.ReactNode;
};

/**
 * Modal katmanını document.body altına render eder. Böylece fixed + backdrop-blur,
 * overflow/transform içeren üst düğümlerde üst kenarda kesilme veya blur uygulanmaması
 * gibi tarayıcı katmanlama sorunları azalır.
 */
export function ModalPortal({ children }: ModalPortalProps) {
  return createPortal(children, document.body);
}
