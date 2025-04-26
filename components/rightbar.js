document.addEventListener("DOMContentLoaded", () => {
  function updateDateAndDay() {
    const now = new Date();

    const formattedDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

    const dateEl = document.getElementById('date');
    const dayEl = document.getElementById('day');

    if (dateEl) dateEl.textContent = formattedDate;
    if (dayEl) dayEl.textContent = dayName;
  }

  setInterval(updateDateAndDay, 1000);
  updateDateAndDay();
});
