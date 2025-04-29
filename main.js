let jsonData = [];
let flattenedKeys = [];
let isCsvMode = false;
// const customTypeOptions = ["alpha", "beta", "charlie", "delta"];

function flattenObject(obj, prefix = "", res = {}) {
  if (Array.isArray(obj)) {
    obj.forEach((val) => {
      flattenObject(val, prefix, res);
    });
  } else if (typeof obj === "object" && obj !== null) {
    for (const key in obj) {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      flattenObject(obj[key], newPrefix, res);
    }
  } else {
    if (typeof obj === "string" && obj.startsWith("{") && obj.endsWith("}")) {
      try {
        const parsed = JSON.parse(obj);
        if (typeof parsed === "object") {
          flattenObject(parsed, prefix, res);
          return;
        }
      } catch (e) {}
    }

    res[prefix] = obj;
  }

  return res;
}

function isFlatRecord(record) {
  return Object.values(record).every(
    (v) => typeof v !== "object" || v === null
  );
}

function previewJsonData(data) {
  const previewBox = document.getElementById("jsonPreview");
  const firstThree = data.slice(0, 3);
  previewBox.textContent = JSON.stringify(firstThree, null, 2);
}

function getAllKeys(data) {
  const keys = new Set();
  data.forEach((record) => {
    const flat = isFlatRecord(record) ? record : flattenObject(record);
    Object.keys(flat).forEach((k) => keys.add(k));
  });
  return Array.from(keys);
}

function populateDropdowns(keys) {
  const flattenedSegments = keys.flatMap((k) => k.split("."));

  const uniqueTypeOptions = new Set([
    // ...customTypeOptions,
    ...flattenedSegments,
  ]);

  const sortedTypeOptions = Array.from(uniqueTypeOptions).sort();

  const typeSelect = document.getElementById("typeSelect");
  typeSelect.innerHTML =
    '<option value="">-- Select --</option>' +
    sortedTypeOptions
      .map((label) => `<option value="${label}">${label}</option>`)
      .join("");

  const otherDropdowns = [
    { id: "valueSelect", options: keys },
    { id: "startSelect", options: keys },
    { id: "endSelect", options: keys },
  ];

  otherDropdowns.forEach(({ id, options }) => {
    const select = document.getElementById(id);
    select.innerHTML =
      '<option value="">-- Select --</option>' +
      options.map((k) => `<option value="${k}">${k}</option>`).join("");
  });

  ["startSelect2", "endSelect2"].forEach((id) => {
    const select = document.getElementById(id);
    select.innerHTML =
      '<option value="">-- Select --</option>' +
      keys.map((k) => `<option value="${k}">${k}</option>`).join("");
  });

  if (!isCsvMode) {
    ["valueSelect", "startSelect", "endSelect"].forEach((id) => {
      document
        .getElementById(id)
        .addEventListener("change", () => updateOtherDropdowns(id));
    });
  }
}

function updateOtherDropdowns(changedId) {
  if (isCsvMode) return;

  const selectedValues = ["valueSelect", "startSelect", "endSelect"].map(
    (id) => document.getElementById(id).value
  );

  ["valueSelect", "startSelect", "endSelect"].forEach((id) => {
    if (id === changedId) return;
    const select = document.getElementById(id);
    const current = select.value;
    select.querySelectorAll("option").forEach((opt) => {
      opt.disabled =
        selectedValues.includes(opt.value) && opt.value !== current;
    });
  });
}

function generateCsv(data, fields) {
  const seen = new Set();

  const headerRow = [fields.type, "start", "end"];

  const rows = data
    .map((record) => {
      const flat = isFlatRecord(record) ? record : flattenObject(record);

      const value = flat[fields.value] ?? "";

      const filterField = document.getElementById("valueFilterField")?.value;
      const filterValue = document.getElementById("valueFilterValue")?.value;

      if (filterField && filterValue) {
        const parentPath = fields.value.split(".").slice(0, -1).join(".");
        const array = getNested(record, parentPath);
        if (Array.isArray(array)) {
          const match = array.some(
            (item) => item?.[filterField]?.toString() === filterValue.toString()
          );
          if (!match) return null;
        }
      }
      let start = flat[fields.start] ?? "";
      if (document.getElementById("startCombine").checked) {
        const secondStartField = document.getElementById("startSelect2").value;
        const start2 = flat[secondStartField] ?? "";
        start = combineToEpoch(start, start2);
      } else {
        start = normalizeToEpoch(start);
      }

      let end = flat[fields.end] ?? "";
      if (document.getElementById("endCombine").checked) {
        const secondEndField = document.getElementById("endSelect2").value;
        const end2 = flat[secondEndField] ?? "";
        end = combineToEpoch(end, end2);
      } else {
        end = normalizeToEpoch(end);
      }

      if (value === "" || start === "" || end === "") {
        return null;
      }

      const row = [value, start, end].map((v) =>
        v.toString().replace(/"/g, '""')
      );
      const key = row.join("|");
      return { row, key };
    })
    .filter(Boolean);

  const uniqueRows = [];
  for (const { row, key } of rows) {
    if (!seen.has(key)) {
      seen.add(key);
      uniqueRows.push(`"${row.join('","')}"`);
    }
  }

  return [headerRow.join(","), ...uniqueRows].join("\n");
}

function previewCsv(csvText) {
  const lines = csvText.split("\n");
  if (lines.length === 0) return;

  const tableHead = document.querySelector("#csvPreviewTable thead");
  const tableBody = document.querySelector("#csvPreviewTable tbody");

  tableHead.innerHTML = "";
  tableBody.innerHTML = "";

  const headers = lines[0].split(",");
  const headRow = document.createElement("tr");
  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header.replaceAll('"', "");
    headRow.appendChild(th);
  });
  tableHead.appendChild(headRow);

  let rowCount = 0;
  for (let i = 1; i < lines.length && rowCount < 3; i++) {
    const rowValues = lines[i].split(",");

    if (rowValues.some((cell) => cell.replaceAll('"', "").trim() === "")) {
      continue;
    }

    const row = document.createElement("tr");
    rowValues.forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = cell.replaceAll('"', "");
      row.appendChild(td);
    });

    tableBody.appendChild(row);
    rowCount++;
  }
}

function combineToEpoch(dateStr, timeStr) {
  if (!dateStr || !timeStr) return "";
  const combined = `${dateStr} ${timeStr}`;
  const dt = new Date(combined);
  return isNaN(dt.getTime()) ? "" : dt.getTime().toString();
}

function normalizeToEpoch(value) {
  if (!value) return "";

  const num = Number(value);
  if (isNaN(num)) return "";

  let seconds;

  if (num > 1e18) {
    seconds = Math.floor(num / 1_000_000_000);
  } else if (num > 1e12) {
    seconds = Math.floor(num / 1_000);
  } else {
    seconds = Math.floor(num);
  }

  const dt = new Date(seconds * 1000);
  return isNaN(dt.getTime()) ? "" : seconds.toString();
}

function setupValueFilterDropdown(valuePath) {
  const filterFieldRow = document.getElementById("valueFilterFieldRow");
  const filterValueRow = document.getElementById("valueFilterValueRow");
  const filterFieldSelect = document.getElementById("valueFilterField");
  const filterValueSelect = document.getElementById("valueFilterValue");

  filterFieldRow.classList.add("hidden");
  filterValueRow.classList.add("hidden");

  const pathParts = valuePath.split(".");
  if (pathParts.length < 2) return;

  const arrayPath = pathParts.slice(0, -1).join(".");
  const fieldName = pathParts[pathParts.length - 1];

  const siblingKeys = new Set();
  const siblingValues = new Map();

  for (const record of jsonData) {
    const target = getNested(record, arrayPath);
    if (!Array.isArray(target)) continue;

    for (const item of target) {
      if (typeof item !== "object" || item === null) continue;
      Object.keys(item).forEach((key) => {
        if (key !== fieldName) {
          siblingKeys.add(key);
          if (!siblingValues.has(key)) siblingValues.set(key, new Set());
          siblingValues.get(key).add(item[key]);
        }
      });
    }
  }

  if (siblingKeys.size === 0) return;

  filterFieldSelect.innerHTML =
    '<option value="">-- Select Field --</option>' +
    Array.from(siblingKeys)
      .sort()
      .map((k) => `<option value="${k}">${k}</option>`)
      .join("");

  filterFieldRow.classList.remove("hidden");

  filterFieldSelect.onchange = () => {
    const selectedField = filterFieldSelect.value;
    if (!selectedField) {
      filterValueRow.classList.add("hidden");
      return;
    }

    const values = Array.from(siblingValues.get(selectedField)).filter(
      (v) => v !== undefined && v !== null
    );

    filterValueSelect.innerHTML =
      '<option value="">-- Select Value --</option>' +
      values
        .sort((a, b) => String(a).localeCompare(String(b)))
        .map((v) => `<option value="${v}">${v}</option>`)
        .join("");

    filterValueRow.classList.remove("hidden");
  };
}

function getNested(obj, path) {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

document.getElementById("valueSelect").addEventListener("change", () => {
  const selected = document.getElementById("valueSelect").value;
  setupValueFilterDropdown(selected);
});

document.getElementById("jsonFile").addEventListener("change", async (e) => {
  isCsvMode = false;

  const files = Array.from(e.target.files);
  if (!files.length) return;

  const list = document.getElementById("fileNameList");
  list.innerHTML = "";
  files.forEach((file) => {
    const li = document.createElement("li");
    li.textContent = file.name;
    li.title = file.name;
    list.appendChild(li);
  });

  jsonData = [];

  for (const file of files) {
    const content = await file.text();
    try {
      let parsed = JSON.parse(content);

      if (!Array.isArray(parsed)) {
        const arrayInObject = Object.values(parsed).find((v) =>
          Array.isArray(v)
        );
        if (arrayInObject) {
          parsed = arrayInObject;
        } else {
          throw new Error("No array found in JSON.");
        }
      }

      const CHUNK_SIZE = 1000;
      for (let i = 0; i < parsed.length; i += CHUNK_SIZE) {
        const chunk = parsed.slice(i, i + CHUNK_SIZE);
        jsonData.push(...chunk);

        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    } catch (err) {
      alert(`Error in file "${file.name}": ${err.message}`);
      console.error(err);
    }
  }

  if (jsonData.length === 0) {
    alert("No valid data found.");
    return;
  }

  flattenedKeys = getAllKeys(jsonData);
  previewJsonData(jsonData);

  populateDropdowns(flattenedKeys);
  document.getElementById("generateCsv").disabled = false;
});

document.getElementById("csvFile").addEventListener("change", async (e) => {
  isCsvMode = true;

  const file = e.target.files[0];
  if (!file) return;

  const text = await file.text();
  const [headerLine, ...lines] = text.trim().split("\n");
  const headers = headerLine.split(",").map((h) => h.replace(/"/g, "").trim());

  jsonData = lines.map((line) => {
    const values = line.split(",").map((v) => v.replace(/"/g, "").trim());
    const obj = {};
    headers.forEach((h, i) => (obj[h] = values[i] || ""));
    return obj;
  });

  previewJsonData(jsonData);

  flattenedKeys = headers;
  populateDropdowns(flattenedKeys);
  document.getElementById("generateCsv").disabled = false;
});

document.getElementById("generateCsv").addEventListener("click", () => {
  const typeField = document.getElementById("typeSelect").value;
  const valueField = document.getElementById("valueSelect").value;
  const startField = document.getElementById("startSelect").value;
  const endField = document.getElementById("endSelect").value;

  if (!typeField || !valueField || !startField || !endField) {
    alert("Please select all required fields (type, value, start, end).");
    return;
  }

  const csv = generateCsv(jsonData, {
    type: typeField,
    value: valueField,
    start: startField,
    end: endField,
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const sizeKB = (blob.size / 1024).toFixed(1);

  const downloadButton = document.getElementById("downloadCsvBtn");
  downloadButton.dataset.blobUrl = url;
  downloadButton.dataset.filename = "output.csv";
  downloadButton.textContent = `Download CSV (${sizeKB} KB)`;
  downloadButton.classList.remove("hidden");

  previewCsv(csv);
});

document.getElementById("downloadCsvBtn").addEventListener("click", () => {
  const btn = document.getElementById("downloadCsvBtn");
  const url = btn.dataset.blobUrl;
  const filename = btn.dataset.filename;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

document.getElementById("startCombine").addEventListener("change", (e) => {
  document
    .getElementById("startSelect2")
    .classList.toggle("hidden", !e.target.checked);
});

document.getElementById("endCombine").addEventListener("change", (e) => {
  document
    .getElementById("endSelect2")
    .classList.toggle("hidden", !e.target.checked);
});
