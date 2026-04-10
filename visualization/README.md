The Exploratory Visualization & Charts setp was done using the features.csv document
A few observations:
    1. The ZCTA was missing for 24192 rows of data. Upon investigation it was identified that 72 unique locations (clean_location_block) had missing ZCTA. 
        This needs to be added in the data cleaning step. 
    2. It was observed that the enforcement_grade A-F had the grade 'E' missing. Looks like a typo in the code of the if-else block. (dc_parking_enforcement_eda.ipynb, code block 62). For the Jupyter Notebook Visualization & Charts 'F' was replaced with 'E'.
    3. It was observed that the total_tickets were concentrated to enforcement grade 'F', all the other grades did not have any values for total_tickets/ k_ticketed
    4. The structure of the Jupyter Notebook Visualization & Charts is given below:
        1. Basis Data Structure Exploration
        2. Exploratory Data Analysis using Visuals 
            a. Analysis of Enforcement Grade
            b. Analysis of Location
            c. Analysis using Wards
        3. Economic Analysis - this is not complete as these ZCTAs are missing from your ACS data:
            ['20597' '20045' '20565' '20319' '20057' '20250']. It needs to be confirmed whether we are using these special ZCTAs as is, or linking it to the nearest residential locations
