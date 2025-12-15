export const isAdminEmail = (email) => {
  if (!process.env.ADMIN_EMAILS) return false;

  const adminList = process.env.ADMIN_EMAILS
    .split(",")
    .map(e => e.trim().toLowerCase());

  return adminList.includes(email.toLowerCase());
};
