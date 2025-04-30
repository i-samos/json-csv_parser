
# JSON/CSV to CSV Converter

A lightweight tool for converting structured **JSON/CSV** data into a clean **CSV** format, with support for flattening, filtering, and parsing date/time fields into epoch timestamps.

## Features

- Upload multiple JSON files or a single CSV file
- Flatten nested JSON objects automatically
- Choose fields for **type**, **value**, **start**, and **end** entries
- **Start and End fields are parsed and converted into epoch timestamps**
- Combine date and time fields into a single epoch timestamp
- Filter JSON arrays by nested fields
- Preview both JSON data and the generated CSV (first 3 records)
- Download the generated CSV file easily

## Technologies Used

- **HTML5**
- **CSS3** (Responsive design, flexbox-based layout)
- **Vanilla JavaScript (ES6+)** (no external libraries)

## Open in Browser

Simply open the `index.html` file in any modern browser.

> No build process or installation required.

**Preview here:** [https://i-samos.github.io/json-csv_parser/index.html](https://i-samos.github.io/json-csv_parser/index.html)

## Usage

1. Upload one or more JSON files **or** a single CSV file.
2. Preview the uploaded data (JSON or CSV).
3. Select the required fields:
   - `Type`
   - `Value`
   - `Start` — **Date/Time field parsed into epoch time**
   - `End` — **Date/Time field parsed into epoch time**
4. (Optional) Combine a second time field with Start/End.
5. (Optional) Apply additional filters to nested array fields.
6. Click **Generate CSV**.
7. Review the CSV preview (first 3 rows).
8. Click **Download CSV**.

## Project Structure

```
/index.html
/styles.css
/main.js
```

## Contribution

Contributions, issues, and feature requests are welcome!

## License

This project is licensed under the **MIT License**.
