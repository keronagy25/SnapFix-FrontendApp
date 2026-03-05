export const Validators = {
  isValidPhone: (phone: string): boolean => {
    // Egyptian phone numbers: 01x-xxxxxxxx
    const egyptPhone = /^01[0125][0-9]{8}$/;
    return egyptPhone.test(phone.replace(/\s/g, ""));
  },

  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidName: (name: string): boolean => {
    return name.trim().length >= 3;
  },

  isValidNationalId: (id: string): boolean => {
    // Egyptian National ID: 14 digits
    return /^\d{14}$/.test(id);
  },

  isValidOTP: (otp: string): boolean => {
    return /^\d{6}$/.test(otp);
  },
};