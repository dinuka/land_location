var axios = require('axios');
var { destinations2: destinations } = require("./destinations");

const API_KEY = "AIzaSyDs9ZFm37wDIWBYiD44iwsy0gKyR9CSP8Y";

const origins = [
    {
        place: "Methma Home",
        location: "7.444497, 79.937777"
    },
    {
        place: "Home",
        location: "6.856434, 79.927989"
    },
    {
        place: "Work",
        location: "6.875864881817855, 79.90012072069752"
    },
    {
        place: "Colombo Fort",
        location: "6.933881602373473, 79.85001481134009"
    },
    {
        place: "Narahenpita",
        location: "6.892390778788063, 79.87692963376774"
    },
    {
        place: "Baththaramulla",
        location: "6.903405393412854, 79.91061839459702"
    },
]

const getDistance = async (originLocation, destinationLocation, avoid, departure) => {
    let url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLocation}&destinations=${destinationLocation}&key=${API_KEY}`;

    if (departure)
        url += "&departure_time=2022-04-08T10:45:00.352Z"
    else
        url += "&arrival_time=2022-04-11T02:45:00.352Z"

    if (avoid)
        url += "&avoid=highways";

    var config = {
        method: 'get',
        url,
        headers: {}
    };

    try {
        const { data } = await axios(config);

        if (data.rows.length) {
            const { distance, duration } = data.rows[0].elements[0];

            return { distance, duration };
        } else {
            console.log(data, "error");
        }

        return { distance: 0, duration: 0 };
    } catch (e) {
        console.log("error");
        console.log(e);
    }
}

const sortFun = (a, b) => {
    return a.min.duration.value - b.min.duration.value
}

const addPoint = (destinationPoints, originPlace, place, value) => {
    if (!destinationPoints[place])
        destinationPoints[place] = 0;

    destinationPoints[place] += 5400 - value;
}

(async () => {
    console.log(new Date().toLocaleString());

    /*
    for (const origin of origins) {
        const i = 1;

        if (origin.location !== origins[i].location) {
            const { distance: ndis, duration: ndur } = await getDistance(origins[i].location, origin.location);
            const { distance: hdis, duration: hdur } = await getDistance(origins[i].location, origin.location, true);

            if (hdur.value !== ndur.value)
                console.log(`${origins[i].place} to ${origin.place} - ${ndis.text}, ${ndur.text}, avoid - ${hdis.text}, ${hdur.text}`);
            else
                console.log(`${origins[i].place} to ${origin.place} - ${ndis.text}, ${ndur.text}`);
        }
    }


    for (const origin of origins) {
        const i = 1;

        if (origin.location !== origins[i].location) {
            const { distance: ndis, duration: ndur } = await getDistance(origin.location, origins[i].location, false);
            const { distance: hdis, duration: hdur } = await getDistance(origin.location, origins[i].location, true);

            if (hdur.value !== ndur.value)
                console.log(`${origin.place} to ${origins[i].place} - ${ndis.text}, ${ndur.text}, avoid - ${hdis.text}, ${hdur.text}`);
            else
                console.log(`${origin.place} to ${origins[i].place} - ${ndis.text}, ${ndur.text}`);
        }
    }
    */

    const originToDestinations = {};
    const destinationPoints = {};

    for (const origin of origins) {
        let to = [];

        for (const destination of destinations) {
            const { distance: ndis, duration: ndur } = await getDistance(origin.location, destination.location, false, false);
            const { distance: hdis, duration: hdur } = await getDistance(origin.location, destination.location, true, false);

            const obj = {
                to: destination.place,
                min: {
                    distance: ndis,
                    duration: ndur
                },
            };

            if (hdur.value !== ndur.value)
                obj.avoid = {
                    distance: hdis,
                    duration: hdur
                }

            to.push(obj);

            addPoint(destinationPoints, origin.place, destination.place, hdur.value);
        }

        to.sort(sortFun);

        originToDestinations[origin.place] = to;
    }

    const destinationToOrigins = {};

    for (const origin of origins) {
        let from = [];

        for (const destination of destinations) {
            const { distance: ndis, duration: ndur } = await getDistance(destination.location, origin.location, false, false);
            const { distance: hdis, duration: hdur } = await getDistance(destination.location, origin.location, true, false);

            const obj = {
                from: destination.place,
                min: {
                    distance: ndis,
                    duration: ndur
                },
            };

            if (hdur.value !== ndur.value)
                obj.avoid = {
                    distance: hdis,
                    duration: hdur
                }

            from.push(obj);

            addPoint(destinationPoints, origin.place, destination.place, hdur.value);
        }

        from.sort(sortFun);

        destinationToOrigins[origin.place] = from;
    }

    for (const [from, toArray] of Object.entries(originToDestinations)) {
        for (const { to, min, avoid } of toArray) {
            if (avoid)
                console.log(`${from} to ${to} - ${min.distance.text}, ${min.duration.text}, avoid - ${avoid.distance.text}, ${avoid.duration.text}`);
            else
                console.log(`${from} to ${to} - ${min.distance.text}, ${min.duration.text}`);
        }
    }

    for (const [to, fromArray] of Object.entries(destinationToOrigins)) {
        for (const { from, min, avoid } of fromArray) {
            if (avoid)
                console.log(`${from} to ${to} - ${min.distance.text}, ${min.duration.text}, avoid - ${avoid.distance.text}, ${avoid.duration.text}`);
            else
                console.log(`${from} to ${to} - ${min.distance.text}, ${min.duration.text}`);
        }
    }

    const sortDestinationPoints = Object.fromEntries(
        Object.entries(destinationPoints).sort(([, a], [, b]) => b - a)
    )

    console.log(sortDestinationPoints);

})();