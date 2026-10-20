# Simple Plex Inlet Builder

Build the sample inlet template for Simple Plex Runner: choose the cartridge, list the analytes, fill in your samples, then export the CSV for import.

**0** analytes × **0** samples = **0** rows

## Run setup

Cartridge format (inlets × analytes)

Inlets

Analytes

Analytes, one per line

Spell each name the way it appears in the cartridge's analyte list in Runner.

Defaults for new samples

Sample type

Dilution

Comment

Output [ ] Leave out inlets with no sample name [ ] Save as Excel-style UTF-8 (BOM), matching your existing template

File name

Start from an existing template Loads analytes and samples from a Runner inlet CSV so you can edit it.

## Samples by inlet

Paste one sample per row, starting at inlet 1. Columns: name, then optional dilution and comment (copy straight from Excel).

[ ] Third column is sample type, fourth is comment

Name prefix

Start at

| Inlet | Sample name | Sample type | Dilution | Comments |
| --- | --- | --- | --- | --- |

## CSV preview

```

```

## Checks

Rows are grouped by analyte, then by inlet, in the same layout as your template.