const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// API to save a project configuration
app.post('/api/save', (req, res) => {
    const projectData = req.body;
    const fileName = `project_${Date.now()}.json`;
    // In a real app, save to DB. Here we just log it or write to file.
    console.log(`Saving project: ${fileName}`);
    // fs.writeFileSync(`./${fileName}`, JSON.stringify(projectData)); 
    res.json({ message: 'Project saved successfully', id: fileName });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});