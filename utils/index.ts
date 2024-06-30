export const formatTimeLocation = (cityDateElement: HTMLElement) => {
  let cityElement: string = "";
  let dateElement: string = "";
  let timestamp: number | null = null;

  const today = new Date();
  const todayFormatted = `${today.getDate()}.${
    today.getMonth() + 1
  }.${today.getFullYear()}`;

  const cityDateText = cityDateElement.innerText.split("-");
  if (cityDateText.length >= 2) {
    cityElement = cityDateText[0].trim();
    const dateText = cityDateText[1].trim();

    // Check if dateText starts with "Dzisiaj"
    if (dateText.startsWith("Dzisiaj")) {
      // Extract time part from "Dzisiaj o 18:11"
      const timePart = dateText.split(" o ")[1];
      dateElement = `${todayFormatted} ${timePart}`;

      // Get timestamp in milliseconds
      const timestampDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        parseInt(timePart.split(":")[0]),
        parseInt(timePart.split(":")[1])
      );
      timestamp = timestampDate.getTime();
    } else {
      dateElement = dateText;

      // Get timestamp in milliseconds
      const dateParts = dateText.split(" ");
      if (dateParts.length >= 2) {
        const day = parseInt(dateParts[0].split(".")[0]);
        const month = parseInt(dateParts[0].split(".")[1]) - 1;
        const year = today.getFullYear();
        const timeParts = dateParts[1].split(":");
        if (timeParts.length >= 2) {
          const hours = parseInt(timeParts[0]);
          const minutes = parseInt(timeParts[1]);
          const timestampDate = new Date(year, month, day, hours, minutes);
          timestamp = timestampDate.getTime();
        }
      }
    }
  }

  return {
    city: cityElement,
    date: dateElement,
    timestamp,
  };
};
