# Data Filtering Logic: Comprehensive Documentation

This section details all queries and code responsible for filtering, selecting, mapping, or otherwise transforming the incident data in the SF Crime Heatmap project. Each entry includes the file, code context, and a description of its filtering role, with **in-line comments** explaining what each portion does.

---

API = "https://data.sfgov.org/resource/wg3w-h783.json"

## 1. **Incident Data Filtering (Map & Main Data Flow)**

### File: `hooks/useIncidents.ts`

#### **SQL Query Filtering**
```ts
// This SQL query fetches only the relevant columns and applies filters to:
// - Exclude incidents with missing coordinates
// - Exclude "Non-Criminal" incidents
// - Restrict to incidents between 2018-01-01 and 2025-12-31
const SQL_QUERY = `
SELECT
  "Incident Datetime" as incident_datetime,
  "Incident Category" as incident_category,
  "Incident Description" as incident_description,
  Latitude as latitude,
  Longitude as longitude
FROM
  sf_crime_stats.data
WHERE
  Latitude IS NOT NULL
  AND Longitude IS NOT NULL
  AND "Incident Category" != 'Non-Criminal'
  AND "Incident Datetime" >= '2018-01-01'
  AND "Incident Datetime" <= '2025-12-31'
ORDER BY "Incident Datetime" DESC;
`
```

#### **Frontend Data Processing**
```ts
// Maps each row from the SQL result to a structured Incident object
// Ensures all fields are present and properly typed
const incidents = result.result.data.toRows().map((row: DuckDBRow) => ({
  incident_datetime: String(row.incident_datetime),
  incident_category: String(row.incident_category),
  incident_description: String(row.incident_description),
  latitude: Number(row.latitude) || 0,
  longitude: Number(row.longitude) || 0,
}))
```

#### **Weekly Binning**
```ts
// Groups incidents by week index, calculated from a START_DATE
// This enables time-based filtering for the time slider UI
const weeklyData = useMemo(() => {
  if (!rawData) return {}
  const weeklyChunks: WeeklyIncidents = {}
  rawData.forEach(incident => {
    const incidentDate = new Date(incident.incident_datetime)
    const weekIndex = Math.floor((incidentDate.getTime() - START_DATE.getTime()) / (7 * 24 * 60 * 60 * 1000))
    if (!weeklyChunks[weekIndex]) {
      weeklyChunks[weekIndex] = []
    }
    weeklyChunks[weekIndex].push(incident)
  })
  return weeklyChunks
}, [rawData])
```

#### **Selected Week Filtering**
```ts
// Selects only the incidents for the currently selected week
// Used to update the map and charts in response to the time slider
const data = useMemo(() => {
  return weeklyData[selectedWeek] || []
}, [weeklyData, selectedWeek])
```

---

## 2. **Sidebar Statistics Filtering**

### File: `hooks/useSidebarStats.ts`

#### **SQL Query Filtering**
```ts
// This SQL query parses incident datetimes, filters by date and category,
// and groups the results by month and category for sidebar analytics
const SQL_QUERY = `
WITH parsed_dates AS (
  SELECT
    CASE
      WHEN "Incident Datetime" LIKE '%/%' THEN strptime("Incident Datetime", '%Y/%m/%d %I:%M:%S %p')
      WHEN "Incident Datetime" LIKE '%-%-% %:%:%' THEN strptime("Incident Datetime", '%Y-%m-%d %H:%M:%S')
      ELSE NULL
    END as parsed_datetime,
    "Incident Category"
  FROM sf_crime_stats.data
  WHERE
    "Incident Datetime" >= '2018-01-01'
    AND "Incident Datetime" <= '2025-12-31'
    AND "Incident Category" != 'Non-Criminal'
)
SELECT
  DATE_TRUNC('month', parsed_datetime) as month,
  "Incident Category",
  COUNT(*) as count
FROM
  parsed_dates
WHERE
  parsed_datetime IS NOT NULL
GROUP BY
  DATE_TRUNC('month', parsed_datetime),
  "Incident Category"
ORDER BY
  month DESC, "Incident Category";
`
```

#### **Frontend Data Mapping**
```ts
// Maps each row from the SQL result to a stats object for the sidebar
// Ensures the date is a string and the total is a number
const stats = result.result.data.toRows().map((row: any) => ({
  date: row.date?.toString() ?? '',
  total: Number(row.total) || 0,
}))
```

---

## 3. **Sidebar Category Color Mapping and Top Categories**

### File: `components/Sidebar.tsx`

#### **Category Color Mapping**
```ts
// Defines the top five crime categories and assigns each a unique color
// These colors are used in all sidebar charts for visual consistency
type CategoryName = 'Larceny Theft' | 'Motor Vehicle Theft' | 'Other Miscellaneous' | 'Assault' | 'Malicious Mischief'
const categoryColors: Record<CategoryName, string> = {
  'Larceny Theft': 'hsl(var(--chart-1))',
  'Motor Vehicle Theft': 'hsl(var(--chart-2))',
  'Other Miscellaneous': 'hsl(var(--chart-3))',
  'Assault': 'hsl(var(--chart-4))',
  'Malicious Mischief': 'hsl(var(--chart-5))',
}
```

#### **Chart Config Construction**
```ts
// Builds a chart config object mapping normalized category keys to their labels and colors
// Used by chart components to render legends and tooltips
const chartConfig = Object.entries(categoryColors).reduce((acc, [category, color]) => {
  acc[category.toLowerCase().replace(/\s+/g, '_')] = {
    label: category,
    color: color,
  }
  return acc
}, {} as ChartConfig)
```

#### **Category Counts and Top Categories**
```ts
// Aggregates the total number of incidents for each top category across all months
// Sorts and selects the top five categories for display in the sidebar
const categoryCounts = {
  'Larceny Theft': stats.reduce((sum, month) => sum + month.larceny_theft, 0),
  'Motor Vehicle Theft': stats.reduce((sum, month) => sum + month.motor_vehicle_theft, 0),
  'Other Miscellaneous': stats.reduce((sum, month) => sum + month.other_miscellaneous, 0),
  'Assault': stats.reduce((sum, month) => sum + month.assault, 0),
  'Malicious Mischief': stats.reduce((sum, month) => sum + month.malicious_mischief, 0),
}

const topCategories = Object.entries(categoryCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
```

#### **Chart Usage**
// The `categoryColors` and `chartConfig` are used in the `AreaChart` and `BarChart` components
// to ensure each category is consistently colored and labeled in the sidebar's visualizations.

---

## 4. **Other Filtering and Mapping Patterns**

### File: `hooks/use-toast.ts`
// Contains reducer logic for filtering and mapping toast notifications, not related to incident data.

---

## 5. **Summary Table**

| File                    | Section/Function                | Filtering/Mapping Logic                                                                                 | Purpose                                      |
|-------------------------|---------------------------------|--------------------------------------------------------------------------------------------------------|----------------------------------------------|
| hooks/useIncidents.ts   | SQL_QUERY                       | WHERE clause: non-null lat/lon, exclude "Non-Criminal", date range 2018-2025                           | Main incident data filtering                 |
| hooks/useIncidents.ts   | map (toRows)                    | Maps SQL rows to Incident objects                                                                      | Data structuring                             |
| hooks/useIncidents.ts   | weeklyData (useMemo)            | Groups incidents by week                                                                               | Temporal filtering for time slider           |
| hooks/useIncidents.ts   | data (useMemo)                  | Selects incidents for selected week                                                                    | Dynamic filtering for visualization          |
| hooks/useSidebarStats.ts| SQL_QUERY                       | WHERE clause: date range, exclude "Non-Criminal", parse dates, group by month/category                 | Sidebar stats filtering                      |
| hooks/useSidebarStats.ts| map (toRows)                    | Maps SQL rows to stats objects                                                                         | Data structuring for sidebar                 |
| components/Sidebar.tsx  | categoryColors, chartConfig     | Maps top categories to colors and chart config                                                         | Consistent chart coloring/labeling           |
| components/Sidebar.tsx  | categoryCounts, topCategories   | Aggregates and sorts top categories for display                                                        | Top category analytics in sidebar            |

---

## 6. **Analytical Notes**

- The majority of filtering is performed at the SQL level for efficiency.
- Additional filtering and grouping is performed in the frontend for interactivity (e.g., weekly binning, time slider, top categories).
- Sidebar statistics use a separate SQL query with similar filters but different grouping (by month and category).
- All mapping from raw SQL to structured objects is handled with `.map()` in the respective hooks.
- Category color mapping and chart config ensure visual consistency and clarity in the sidebar's analytics.

---

This documentation provides a complete reference for all data filtering, selection, mapping, and category color logic in the project, with in-line comments for each code portion. For further details, refer to the code sections and files listed above.


---
description: 'Revised: 03/2023'
---

# SFPD Incident Report: 2018 to Present

The San Francisco Police Department’s (SFPD) [Incident Report Datatset](https://data.sfgov.org/Public-Safety/Police-Department-Incident-Reports-2018-to-Present/wg3w-h783) is one of the most used datasets on DataSF. The dataset compiles data from the department’s Crime Data Warehouse (CDW) to provide information on incident reports filed by the SFPD in CDW, or filed by the public with the SFPD.

## How can this Dataset be best used?

The incident report dataset is good at providing counts of incident reports, by type, date, time and location. This information can be used to help understand the number, location, and nature, of incidents of crime that are reported to or reported by the SFPD. Geographic information is anonymized and provided to help understand incident reports across neighborhoods, police districts and supervisorial districts. Provision of date information allows for analysis of data trends over time.

## Are incident reports the ‘official’ count of crime?

No. While incident reports may serve as the basis for official crime statistics, official crime statistics are governed by the FBI’s [UCR and NIBRS program](https://www.fbi.gov/services/cjis/ucr/). The most recent official UCR/NIBRS statistical release from the SFPD can be found via the [California Department of Justice’s Open Justice portal](https://openjustice.doj.ca.gov/).

## What are incident reports?

This dataset includes incident reports that have been filed as of January 1, 2018. These reports are filed by officers or self-reported by members of the public using [SFPD’s online reporting system](https://www.sanfranciscopolice.org/get-service/police-reports/file-police-report). The reports are categorized into the following types based on how the report was received and the type of incident:

1. **Initial Reports**: the first report filed for an incident
2. **Supplemental Reports:** a follow up report to an initial, Coplogic or vehicle report.
3. **Coplogic Reports**: incident reports filed by members of the public using SFPD’s online reporting system
4. **Vehicle Reports**: any incident reports related to stolen and/or recovered vehicles

All incident reports must be approved by a supervising Sergeant or Lieutenant. Once a supervising officer has provided approval via electronic signature, no further changes can be made to the initial report. If changes or additional information is required or discovered during an investigation, a **supplemental report** may be generated to capture updates.

For example, a supplemental report may be issued to show an arrest was made, a missing person was found, or to provide additional details of property taken in a theft. To differentiate between the initial and supplemental reports, a filter can be applied to the “Report Type Description” field. Failing to filter between the initial and supplemental report can lead to double counting of incidents.

The department uses a Secure File Transfer Protocol (SFTP) feed to share incident data with DataSF daily.

## Multiple Incident Codes

Incident reports can have one or more associated Incident Codes. For example, an officer may have a warrant for an arrest and while making the arrest, discovers narcotics in the individual’s possession. The officer would record two Incident Codes: (1) for the warrant and (2) for the discovery of narcotics.

When multiple Incident Codes exist, the Incident ID, Incident Number and CAD Numbers remain the same and the Row ID field can be used as a unique identifier for each row of data.  An example is provided below.

| **Incident Datetime** | **Row ID**      | **Incident ID** | **Incident Number** | **CAD Number** | **Incident Code** | **Incident Category** |
| --------------------- | --------------- | --------------- | ------------------- | -------------- | ----------------- | --------------------- |
| 1/1/18 13:20          | **61902222223** | 60044           | 180999999           | 180222222      | 62050             | Warrant               |
| 1/1/18 13:20          | **61903333320** | 60044           | 180999999           | 180222222      | 16710             | Drug Offense          |



## What is not captured in this data set?

Incident reports do not necessarily capture all data surrounding policing and crime. This dataset does not capture citations (unless an associated incident report was written with the citation.) For example, a routine speeding ticket would generally not require an incident report, however, a speeding ticket that reveals a driver with a felony warrant leading to an arrest would require an incident report.

This dataset does not include any identifiable information of any person (suspect, victim, reporting party, officer, witness, etc). This dataset may not capture other law enforcement agency incidents within San Francisco (BART PD, US Park Police, for example), or reports not filed with the SFPD.

## What privacy controls are this data set subject to?

The release of this data must balance the need for disclosure to the public against the risk of violating the privacy of those individuals present within the dataset. As such, the dataset is subject to several privacy controls to ensure anonymity for all persons within the data.

In summary:

1. All incident locations are shown at the intersection level only.
2. Records involving juveniles have been withheld from this dataset.
3. All records coded as confidential have been withheld from this dataset.

Incident reports may be removed from the dataset in compliance with court orders to seal records or for administrative purposes such as active internal affairs investigations and/or criminal investigations. The data shared does not include personally identifiable information on any person within the dataset (suspect, victim, reporting party, officer, witness, etc).

## Mapping Coordinates

Coordinates associated with incident locations provided within the dataset are anonymized and reflect the nearest intersection of each occurrence. Intersections used in the masking are associated with either 0 or greater than 11 premise addresses. A premise address is a specific place of work or residence. Some coordinates may be omitted for the following reasons:

1. **Invalid addresses** - addresses submitted by officer’s pass-through validation, however, the online submission does not validate addresses on entry. While best efforts are made to match those to valid addresses when loading to the Crime Data Warehouse, there are still technical limitations to fixing all poorly formed addresses.
2. **Addresses for incidents outside of SF** - some cases are referred from outside SFPD districts. These will be marked as “Out of SF” in the Police District column and do not have associated geographic information.

## Juvenile Data

Per California Government Code (GC) § 6254 and California Welfare and Institutions Code § 827, incidents identifying juvenile information will not be available in this dataset. All incidents with a resolution of “Cite or Arrest Juvenile” and/or “Exceptional Juvenile” have been removed from this dataset. In the case of an incident where multiple individuals, juvenile and adult, are present, the entire incident is removed. In addition, the following juvenile related Incident Codes have been removed from this dataset:

| **Incident Code** | **Incident Code Description**                                     |
| ----------------- | ----------------------------------------------------------------- |
| 02010             | Unlawful Sexual Intercourse with Minor                            |
| 04147             | Sexual Assault, Aggravated, of Child                              |
| 13073             | Minor, Abduction of for Prostitution                              |
| 14010             | Children, Annoy Or Molest                                         |
| 14015             | Child Abuse, Sexual                                               |
| 14016             | Sex Act, Agreement of Parent to Pay Minor Victim of               |
| 14017             | Obscene Matter, Distribution to Minors                            |
| 14044             | Indecent Exposure (Juvenile victim)                               |
| 14050             | Oral Copulation, Unlawful (Juvenile Victim)                       |
| 14070             | Sodomy (Juvenile Victim)                                          |
| 15010             | Child Under 14, Willful Abandonment or Nonsupport of              |
| 15015             | Child, Inflicting Physical Pain, Mental Suffering, or Death       |
| 15016             | Child Abuse, Exploitation                                         |
| 15017             | Child Abuse, Pornography                                          |
| 15020             | Persuading Child Under14 to Go Somewhere for Sex Act              |
| 15021             | Kidnapping (Juvenile Victim)                                      |
| 15022             | Kidnapping, Attempted (Juvenile Victim)                           |
| 15030             | Minor, Contributing To Delinquency of                             |
| 15031             | Tobacco Products, Selling or Furnishing to Minor                  |
| 15032             | Minor Purchasing or Receiving Tobacco Product                     |
| 15040             | Spouse, Cohabitee, Parent of Child in Common, Inflict Injury      |
| 15041             | Elder Adult or Dependent Abuse (not Embezzlement or Theft)        |
| 15050             | Child, Willful Desertion of                                       |
| 15051             | Children, Abandonment & Neglect of (general)                      |
| 15052             | Child, Inflicting Injury Resulting in Traumatic Condition         |
| 15054             | Harassing Child or Ward because of Person's Employment            |
| 15060             | Child, Failure To Provide                                         |
| 15070             | Parent, Indigent, Failure To Provide for                          |
| 15080             | Wife, Failure To Provide For                                      |
| 15090             | Child, Drunk Habitually In Presence Of/Immoral Acts Before        |
| 15100             | Child, Willful Cruelty To                                         |
| 15500             | Juvenile Involved (secondary code)                                |
| 16070             | Marijuana, Encouraging Minor To Use                               |
| 16140             | Heroin, Encouraging Minor To Use                                  |
| 16250             | Opiates, Encouraging Minor To Use                                 |
| 16350             | Opium Derivative, Encouraging Minor To Use                        |
| 16450             | Hallucinogenic, Encouraging Minor To Use                          |
| 16618             | Opium, Encouraging Minor To Use                                   |
| 16628             | Cocaine, Encouraging Minor To Use                                 |
| 16638             | Methadone, Encouraging Minor To Use                               |
| 16648             | Amphetamine, Encouraging Minor To Use                             |
| 16658             | Methamphetamine, Encouraging Minor To Use                         |
| 16668             | Controlled Substance, Encouraging Minor To Use                    |
| 17010             | Minor, False Evidence Of Age                                      |
| 17040             | Minor Inside On-sale Licensed Premise                             |
| 17050             | Alcohol, Purchasing by Minor                                      |
| 17060             | Alcohol, Possession Of By Minor                                   |
| 17080             | Alcohol, Sale Of To Minor                                         |
| 17090             | Alcohol, Sale Of To Minor In Bar                                  |
| 17100             | Alcohol, Sale Of By Minor                                         |
| 26070             | Child Concealment, Depriving Lawful Custodian                     |
| 27180             | Glue, Restricted, Selling to Juvenile                             |
| 28091             | Malicious Mischief, Juvenile Suspect                              |
| 29010             | Minor Beyond Parental Control                                     |
| 29020             | Curfew Violation                                                  |
| 29030             | Juvenile in Danger Of Leading Immoral Life                        |
| 29040             | Minor, Destitute                                                  |
| 29050             | Escapee, Juvenile                                                 |
| 29060             | Glue Sniffing, Juvenile                                           |
| 29070             | Habitual Truant                                                   |
| 29080             | Juvenile, Intoxicated                                             |
| 29081             | Minor, Allowing to Drive Intoxicated or after 23103 VC Conviction |
| 29082             | Tattooing Person under 18                                         |
| 29083             | Soliciting Minor to Commit Felony                                 |
| 29090             | Parole Violation, Juvenile                                        |
| 29100             | Runaway                                                           |
| 29110             | Minor Without Proper Parental Care                                |
| 29120             | Shelter                                                           |
| 29130             | Youth Court                                                       |
| 29170             | Truant, Habitual                                                  |
| 64050             | Child, Suspicious Act Towards                                     |
| 74010             | Missing Juvenile                                                  |

The removal of juvenile related data in 2020 resulted in the retention of 3,581 records, or about 2.82% of the unredacted 2020 dataset.

| **Crime Category Description**           | **Juvenile related Incident Reports** |
| ---------------------------------------- | ------------------------------------- |
| Unknown                                  | 494                                   |
| Aggravated Assault                       | 1521                                  |
| Other Assaults                           | 46                                    |
| Vice, Prostitution                       | 1                                     |
| Sex Offenses (Not Rape and Prostitution) | 159                                   |
| Narcotics                                | 2                                     |
| Offenses Against Family and Child        | 1169                                  |
| Malicious Mischief                       | 12                                    |
| Liquor Laws                              | 7                                     |
| Juvenile Offenses                        | 111                                   |
| Other Miscellaneous                      | 59                                    |
| **Total**                                | **3581**                              |

Juvenile Records Retained, by Crime Category - 2020

## Confidential Data

The SFPD routinely codifies certain incident reports as confidential for various reasons. These reasons include at the request of the reporting party, due to the sensitivity of the investigation, or at the request of the investigator or chain of command.

In 2020, 7,414 confidential flagged reports were retained by the department, or about 5.8% of the unredacted dataset. Of the 7,414 reports, 53% were also flagged as domestic violence reports.

## **Field Definitions**



<table data-header-hidden><thead><tr><th width="149.33333333333331">Field Name</th><th width="396">Definition</th><th>API Name</th></tr></thead><tbody><tr><td><strong>Field Name</strong></td><td><strong>Definition</strong></td><td><strong>API Name</strong></td></tr><tr><td>Incident Date</td><td>The date and time when the incident occurred</td><td>incident_datetime</td></tr><tr><td>Incident Date</td><td>The date the incident occurred</td><td>incident_date</td></tr><tr><td>Incident Time</td><td>The time the incident occurred</td><td>incident_time</td></tr><tr><td>Incident Year</td><td>The year the incident occurred, provided as a convenience for filtering</td><td>incident_year</td></tr><tr><td>Incident Day of Week</td><td>The day of week the incident occurred</td><td>incident_day_of_week</td></tr><tr><td>Report Datetime</td><td>Distinct from Incident Datetime, Report Datetime is when the report was filed.</td><td>report_datetime</td></tr><tr><td>Row ID</td><td>A unique identifier for each row of data in the dataset</td><td>row_id</td></tr><tr><td>Incident ID</td><td>This is the system generated identifier for incident reports. Incident IDs and Incident Numbers both uniquely identify reports, but Incident Numbers are used when referencing cases and report documents.</td><td>incident_id</td></tr><tr><td>Incident Number</td><td>The number issued on the report, sometimes interchangeably referred to as the Case Number.  This number is used to reference cases and report documents.</td><td>incident_number</td></tr><tr><td>CAD Number</td><td>The Computer Aided Dispatch (CAD) is the system used by the Department of Emergency Management (DEM) to dispatch officers and other public safety personnel. CAD Numbers are assigned by the DEM system and linked to relevant incident reports (Incident Number). Not all Incidents will have a CAD Number. Those filed online via Coplogic (refer to “Filed Online” field) and others not filed through the DEM system will not have CAD Numbers.</td><td>cad_number</td></tr><tr><td>Report Type Code</td><td>A system code for report types, these have corresponding descriptions within the dataset.</td><td>report_type_code</td></tr><tr><td>Report Type Description</td><td><p>The description of the report type, can be one of:</p><p>·        Initial</p><p>·        Initial Supplement</p><p>·        Vehicle Initial</p><p>·        Vehicle Supplement</p><p>·        Coplogic Initial</p><p>·        Coplogic Supplement</p></td><td>report_type_description</td></tr><tr><td>Filed Online</td><td><p>Non- emergency police reports can be filed online by members of the public using SFPD’s self-service reporting system called Coplogic Values in this field will be “TRUE” if Coplogic was used to file the report. Please reference the link below for additional info:</p><p>(<a href="http://sanfranciscopolice.org/reports">http://sanfranciscopolice.org/reports</a>).</p></td><td>filed_online</td></tr><tr><td>Incident Code</td><td>Incident Codes are the system codes to describe a type of incident. A single incident report can have one or more incident types associated. In those cases you will see multiple rows representing a unique combination of the Incident ID and Incident Code.</td><td>incident_code</td></tr><tr><td>Incident Category</td><td>A category mapped on to the Incident Code used in statistics and reporting. Mappings provided by the Crime Analysis Unit of the Police Department.</td><td>incident_category</td></tr><tr><td>Incident Subcategory</td><td>A subcategory mapped to the Incident Code that is used for statistics and reporting. Mappings are provided by the Crime Analysis Unit of the Police Department.</td><td>incident_subcategory</td></tr><tr><td>Incident Description</td><td>The description of the incident that corresponds with the Incident Code. These are generally self-explanatory.</td><td>incident_description</td></tr><tr><td>Resolution</td><td><p>The resolution of the incident at the time of the report. Can be one of:</p><p>·        Cite or Arrest Adult</p><p>·        <strong>Cite or Arrest Juvenile*</strong></p><p>·        Exceptional Adult</p><p>·        <strong>Exceptional Juvenile*</strong></p><p>·        Open or Active</p><p>·        Unfounded</p><p>Note: once a report is filed, the Resolution will not change. Status changes and/or updates must be provided using a Supplemental Report</p><p>*Incidents identifying juvenile information are not included in this dataset. Please see the Juvenile Data section for more information.</p></td><td>resolution</td></tr><tr><td>Intersection</td><td>2 or more street names that intersect closest to the incident location, separated by a backward slash (). An incident number may have multiple locations listed due to differing locations reported in supplemental reports, i.e., an arrest location or the location of missing person found. Note, the possible intersections will only include those that satisfy the privacy controls."</td><td>intersection</td></tr><tr><td>Supervisor District</td><td><p>Current Supervisor District: There are 11 members elected to the Board of Supervisors in San Francisco, each representing a geographic district. The Board of Supervisors is the legislative body for San Francisco. The districts are numbered 1 through 11. Please reference the link below for additional info: <a href="https://data.sfgov.org/d/cqbw-m5m3">https://data.sfgov.org/d/cqbw-m5m3</a> </p><p>As mentioned <a href="https://datasf.gitbook.io/datasf-dataset-explainers/~/changes/nsN2cu23Rq7kKjnAJsXs/sfpd-incident-report-2018-to-present#what-privacy-controls-are-this-data-set-subject-to">above</a>, the actual location of police incidents have been partially obfuscated (anonymized) to protect the privacy of those involved. This means that the Supervisor District boundary is assigned based on the intersection closest to the incident location. This may differ slightly from the District the incident actually occurred within.</p></td><td>supervisor_district</td></tr><tr><td>Supervisor District 2012</td><td><p>Previous 2012-2022 Supervisor District: There are 11 members elected to the Board of Supervisors in San Francisco, each representing a geographic district. The Board of Supervisors is the legislative body for San Francisco. The districts are numbered 1 through 11. Please reference the link below for additional info: <a href="https://data.sfgov.org/d/keex-zmn4">https://data.sfgov.org/d/keex-zmn4</a> </p><p>As mentioned <a href="https://datasf.gitbook.io/datasf-dataset-explainers/~/changes/nsN2cu23Rq7kKjnAJsXs/sfpd-incident-report-2018-to-present#what-privacy-controls-are-this-data-set-subject-to">above</a>, the actual location of police incidents have been partially obfuscated (anonymized) to protect the privacy of those involved. This means that the Supervisor District boundary is assigned based on the intersection closest to the incident location. This may differ slightly from the District the incident actually occurred within.</p></td><td>supervisor_district_2012</td></tr></tbody></table>
