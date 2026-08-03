// Shared human-readable date formatting — used in HR email templates and Trainee
// contract/certificate content.

function formatDate(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

module.exports = formatDate;
