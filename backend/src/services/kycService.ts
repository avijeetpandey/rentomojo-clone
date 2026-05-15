import { z } from 'zod';
import { kycRepository } from '../repositories/kycRepository';
import { HttpError } from '../utils/httpError';

export const kycSubmitSchema = z.object({
  documentType: z.enum(['AADHAAR', 'PASSPORT', 'DRIVING_LICENSE']),
  documentNumber: z.string().min(4).max(40),
  // Simulated file upload — we just accept a base64 stub or filename.
  documentRef: z.string().min(1).max(255),
});

export type KycSubmitInput = z.infer<typeof kycSubmitSchema>;

export const kycService = {
  /**
   * Simulates KYC verification: PASSPORT/DRIVING_LICENSE auto-approve;
   * AADHAAR documents with numbers ending in '0000' are auto-rejected
   * (for demoing the failure path). Everything else is approved.
   */
  async submit(userId: string, input: KycSubmitInput) {
    const approved = !(input.documentType === 'AADHAAR' && input.documentNumber.endsWith('0000'));
    if (!approved) {
      await kycRepository.updateStatus(userId, 'REJECTED', input.documentRef);
      throw HttpError.badRequest(
        'KYC rejected: document failed verification. Please try a different document.',
      );
    }
    const result = await kycRepository.updateStatus(userId, 'APPROVED', input.documentRef);
    return { status: result.kycStatus, documentRef: input.documentRef };
  },
};
