/**
 * Utility to serialize Date objects to ISO strings
 * Fixes issue where nested Date objects in prescription objects
 * cause React rendering errors ("Objects are not valid as a React child")
 */

export function serializePrescription(prescription: any): any {
  if (!prescription) return prescription;

  return {
    ...prescription,
    // Serialize prescription-level dates
    createdAt: prescription.createdAt
      ? new Date(prescription.createdAt).toISOString()
      : prescription.createdAt,
    updatedAt: prescription.updatedAt
      ? new Date(prescription.updatedAt).toISOString()
      : prescription.updatedAt,
    validUntil: prescription.validUntil
      ? new Date(prescription.validUntil).toISOString()
      : prescription.validUntil,

    // Serialize patient dates
    patient: prescription.patient
      ? {
          ...prescription.patient,
          birthDate: prescription.patient.birthDate
            ? new Date(prescription.patient.birthDate).toISOString()
            : prescription.patient.birthDate,
          createdAt: prescription.patient.createdAt
            ? new Date(prescription.patient.createdAt).toISOString()
            : prescription.patient.createdAt,
          updatedAt: prescription.patient.updatedAt
            ? new Date(prescription.patient.updatedAt).toISOString()
            : prescription.patient.updatedAt,
        }
      : null,

    // Serialize prescriber dates
    prescriber: prescription.prescriber
      ? {
          ...prescription.prescriber,
          createdAt: prescription.prescriber.createdAt
            ? new Date(prescription.prescriber.createdAt).toISOString()
            : prescription.prescriber.createdAt,
          updatedAt: prescription.prescriber.updatedAt
            ? new Date(prescription.prescriber.updatedAt).toISOString()
            : prescription.prescriber.updatedAt,
        }
      : null,

    // Serialize item dates (if they have any)
    items: prescription.items
      ? prescription.items.map((item: any) => ({
          ...item,
          createdAt: item.createdAt
            ? new Date(item.createdAt).toISOString()
            : item.createdAt,
          updatedAt: item.updatedAt
            ? new Date(item.updatedAt).toISOString()
            : item.updatedAt,
        }))
      : [],
  };
}
