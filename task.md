# Interview Task

**Time:** 30 minutes
**Tools:** Use any AI assistant (Cursor, Copilot, Claude, etc.) and any data source you choose.

## Build

A simple dashboard that:

1. Pulls the current temperature for **Moscow** from a weather API.
2. Shows an alert on the dashboard if the current temperature is more than **5 degrees** off the average for this day last year.

## Deliverable

Push your solution to a GitHub repository and share the link. Include manual and automated tests if time allows.

## How we work

Ask questions. The prompt is brief on purpose. Working out what you actually need to build is part of the task. Talk through your decisions as you go.



#####

front
    create a dash to see moscow actual temperature and every  10 seconds do a req to a api do req the actual temperature if is more than **5 degrees** off the average for this day last year


back-end
    an api that pull the current temparature for **Moscow** every of https://api.open-meteo.com/v1/forecast?latitude=55.7558&longitude=37.6173&current=temperature_2m, so youre gonna recieve a request without body and response the actual temperature and get the avarage temperature on this same day last year, and if hits 5 degrees higher send an response field - higher as true   


    Future tests:
        fake the response to see if the front end reflects it
        do a fallback when the main api fail