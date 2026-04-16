const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getVirtualSlots = (professorId, days = 7) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fixedTimes = [
        { startTime: "12:00 PM", endTime: "01:00 PM" },
        { startTime: "01:00 PM", endTime: "02:00 PM" },
        { startTime: "02:00 PM", endTime: "03:00 PM" }
    ];

    const virtualSlots = [];

    for (let i = 0; i < days; i++) {

        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);

        const dayOfWeek = currentDate.getDay();
        const dateString = getLocalDateString(currentDate);

        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            for (const time of fixedTimes) {
                virtualSlots.push({
                    professorId,
                    date: dateString,
                    startTime: time.startTime,
                    endTime: time.endTime,
                    status: "available",
                    isVirtual: true
                });
            }
        }

    }

    return virtualSlots;
};