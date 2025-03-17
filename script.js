// Funkcia na načítanie JSON dát z URL
async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        return jsonData;
    } catch (error) {
        console.error("Error fetching JSON:", error);
        alert("Error fetching JSON from URL.");
        return null;
    }
}

// Funkcia na mapovanie JSON dát do formátu udalostí
function mapJSONToEvents(inputJSON, year) {
    const events = [];

    for (const month in inputJSON) {
        for (const day in inputJSON[month]) {
            const names = inputJSON[month][day];
            const event = {
                summary: names,
                description: 'Meniny Slovensko',
                year: year,
                month: parseInt(month),
                day: parseInt(day),
                uid: generateUUID()
            };
            events.push(event);
        }
    }

    return { events: events };
}

// Funkcia na generovanie unikátneho ID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Funkcia na generovanie ICS súboru z JSON dát
function generateYearlyDailyRecurrenceICSFromJSON(jsonData) {
    if (!jsonData || !jsonData.events || !Array.isArray(jsonData.events)) {
        console.error("Invalid JSON data format.");
        return null;
    }

    let icsContent = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Meniny//SK\r\n`;

    jsonData.events.forEach(event => {
        if (!event.summary || !event.year || !event.month || !event.day) {
            console.error("Missing required fields in event:", event);
            return;
        }

        const dtstamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
        const dtstart = `${event.year}${String(event.month).padStart(2, '0')}${String(event.day).padStart(2, '0')}`;
        const monthStr = String(event.month).padStart(2, '0');
        const dayStr = String(event.day).padStart(2, '0');
        const uid = event.uid || generateUUID();

        icsContent += `BEGIN:VEVENT\r\nUID:${uid}\r\nDTSTAMP:${dtstamp}\r\nDTSTART;VALUE=DATE:${dtstart}\r\nSUMMARY:${event.summary}\r\nDESCRIPTION:${event.description}\r\nRRULE:FREQ=YEARLY;BYMONTHDAY=${dayStr};BYMONTH=${monthStr}\r\nEND:VEVENT\r\n`;
    });

    icsContent += `END:VCALENDAR`;
    return icsContent;
}

// Funkcia na stiahnutie ICS súboru
function downloadICS(icsContent, filename) {
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'events.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

document.getElementById('generateICSButton').addEventListener('click', async () => {
    const url = 'sk-meniny.json';
    if (url) {
        const inputJSON = await fetchJSON(url);
        if (inputJSON) {
            const year = '2024';
            const jsonData = mapJSONToEvents(inputJSON, year);
            const icsContent = generateYearlyDailyRecurrenceICSFromJSON(jsonData);
            if (icsContent) {
                console.warn(icsContent);
                
                downloadICS(icsContent, 'meniny_slovensko.ics');
            }
        }
    }
});