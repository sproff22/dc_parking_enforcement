**Ticket Patterns: Spatiotemporal Modeling and Equity Analysis of Parking Enforcement in Washington, D.C.**  
Arun Polumbaum, Gabriel Castaneda, Katherine Morton, Meghan Peters, Samuel Roffman, Sara Jacob  
Team \#103 | CSE 6242 Data and Visual Analytics

**1\. Introduction**

In urban areas such as Washington D.C, parking enforcement is a pervasive yet opaque aspect of day-to-day life. For the city, a parking ticket acts as a tool for traffic management and revenue; for the residents, it is often an unpredictable financial burden. Currently, the internal dashboards used by the city to track violations remain inaccessible to the public. The objective of this project is to develop an interactive and user-friendly tool that provides probabilistic estimates of citation risk based on location, day of week, time of day (2-hour bands), and season. Simultaneously, the project also explores whether enforcement patterns disproportionately target neighborhoods based on racial or income demographics. By leveraging historical D.C. Open Data and U.S. Census Bureau (ACS) demographics, we aim to build a solution that can be utilized by residents to predict the likelihood of receiving a parking ticket in Washington D.C. By combining individual risk prediction with an equity analysis, we aim to empower users to make informed choices while providing the city with the necessary data to ensure fair enforcement practices.

**2\. Problem Definition**

This project addresses two-challenges in parking enforcement: information asymmetry in accessing individual parking risk and lack of transparency when it comes to geographic enforcement equity. The methods used today for avoiding parking citations are reactive and informal. Existing research discusses enforcement disparities \[1\]\[2\]\[3\] but no tool lets residents assess their own citation risk or explore equity patterns interactively \[5\]\[16\]. By transforming open source data into a tool that facilitates individual decision-making and civic accountability, we aim to bridge this gap. 

**3\. Literature Survey** 

**Parking Equity and Neighborhood Inequality:** Brazil (2018) and Brazil, Vang & Abdelnur (2024) show citations concentrated in lower-income, minority neighborhoods across U.S. cities, motivating our equity analysis \[1\]\[2\]. Wo, Kim & Malone (2025) confirm similar patterns in San Francisco \[3\]. Schultheiss (2024) provides context on how residential preferences shape neighborhood parking behavior \[6\]. None produce a predictive tool, a gap we address.

**Parking Behavior and Spatial Modeling:** Delialis (2025) benchmarks our spatial smoothing via KDE, though relies on crowdsourced data \[5\]. Chen (2025) parallels our D.C. approach using a Bayesian model on NYC data, though does not address equity \[18\]. Borowska-Stefańska (2025) validates road network configuration as a parking driver, though in a European context \[7\]. Ambo, Ma & Fu (2021) validate logistic regression as a citation risk baseline, though limited to one Chinese city \[8\]. 

**Crime & Enforcement Prediction:** Anselin (2022) provides spatial lag model foundations for controlling autocorrelation \[10\]. Butt (2020) confirms that combined usage of spatial and temporal features for analysis outperform using either of them alone, though the study is crime-focused \[14\]. Chainey, Tompson & Uhlig (2008) validate KDE for spatial prediction, though it predates deep learning \[15\]. Meijer & Wessels (2019) show most policing tools serve agencies not residents, motivating our design \[16\]. Mohler (2015) validates predictive policing algorithms in field trials, though crime-focused \[19\]. Rotaru (2022) reveals socioeconomic enforcement bias in U.S. cities, the closest analogue to our hypothesis \[17\]. Akhawaji, Sedky & Soliman (2017) contextualize digital enforcement trends via camera-based detection, though requires video infrastructure unavailable in D.C. data \[9\]. 

**Interactive Urban Visualizations:** Garcia-Zanabria (2021) presents CriPAV, a street-level crime visualization tool whose choropleth and point map design informs our UI, though adaptation from crime to parking is required \[11\]. Maciejewski (2010) develops spatiotemporal hotspot visualization modeling our time-of-day slider and heatmap, though it predates modern web mapping \[12\]. Miranda (2024) surveys urban visual analytics interaction patterns relevant to our design, though broader than our 2D map interface \[13\].

**4\. Proposed Method** 

We model parking enforcement risk as a probabilistic, spatiotemporal process using an empirical Bayesian framework, rather than a traditional supervised classifier. This is motivated by the data where we observe only citation events without explicit negative examples, and overall enforcement is sparse relative to all possible parking opportunities. As a result, standard classification approaches like logistic regression are not well-suited to this problem.

We treat enforcement as a Bernoulli event and estimate how often it occurs under specific conditions. Each observation unit is defined by a combination of location, day of week, time of day in 2-hour bands, and season. For each combination, we compute a raw recurrence rate, representing the proportion of time intervals in which at least one ticket occurs.

To address sparsity and variability, we apply a beta-binomial empirical Bayes approach to produce a posterior recurrence score. This smooths extreme values toward a global baseline while preserving meaningful differences in high-activity areas. We also scale scores based on overall enforcement intensity at each block, so higher-volume locations are appropriately distinguished from lower-activity ones. For interpretability, posterior scores are mapped to a discrete A–F grading system, where A represents low enforcement risk and F represents high risk. This allows users to quickly understand risk without needing to interpret raw probabilities.

The idea is to have the model deployed as an interactive map where users can enter a location, date, and parking time window to see their estimated risk of receiving a ticket, overlaid on a map showing enforcement intensity by neighborhood. Time-of-day and demographic filters allow both everyday residents and city planners to explore spatiotemporal and neighborhood-level patterns without requiring technical expertise. In parallel, we are extending the model to incorporate neighborhood-level demographic data from the U.S. Census. This allows us to examine whether enforcement intensity varies across neighborhoods with different socioeconomic characteristics, supporting both individual-level risk estimation and equity analysis within the same framework.

Key Innovations:

* **Fine-grained spatiotemporal modeling:** Estimates risk at the level of block, time, day, and season, moving beyond simple hotspot maps to provide condition-specific predictions.  
* **Intuitive grading and visualization:** Mapping probabilistic outputs to an A–F scale and integrating them into an interactive interface for easy user interpretation.  
* **Unified prediction and equity analysis:** Incorporates demographic data to simultaneously estimate individual risk and evaluate neighborhood-level enforcement disparities.

**5\. Evaluation** 

We plan to evaluate our approach along two dimensions: predictive performance and interpretability. Since the model estimates enforcement likelihood rather than exact events, evaluation will focus on how well posterior scores align with observed patterns. We will also compare the posterior scores against raw recurrence rates to determine whether the Empirical Bayes smoothing improves interpretability. We plan to evaluate the model by applying it to 2026 parking enforcement data and monitoring its performance going forward as data continues to be made available. We also plan to examine the stability of predictions, particularly in low-sample settings. 

For the interactive map, we will assess whether outputs are consistent and intuitive through team-based testing of UI functionality and user testing within our professional networks to evaluate both the model and interface. Finally, we will explore differences in enforcement scores across neighborhoods with varying socioeconomic characteristics. For the equity analysis we will compare modelled enforcement intensity across neighborhoods after joining the census based demographic variables. These comparisons will be descriptive rather than causal with the goal of identifying whether higher modeled risk appears concentrated in particular communities. 

This section will be expanded with results in the final report.

**6\. Conclusions and Discussion** 

We aim to develop a probabilistic, user-facing tool for estimating parking enforcement risk based on location and time. By combining spatiotemporal modeling with an empirical Bayes framework, the approach is designed to produce stable and interpretable risk estimates.

We expect the results to show that our method can effectively distinguish between high and low-risk parking scenarios, outperforming simple baseline approaches based on average enforcement rates. We also anticipate that the A–F grading system and interactive interface will provide an intuitive way for users to understand and act on these risk estimates. We anticipate that enforcement intensity will vary across neighborhoods with different socioeconomic characteristics, as observed in prior work, highlighting the benefit of combining individual risk prediction with equity analysis.

This section will be expanded with results in the final report.

**7\. Updated plan of activities**

Minimal changes have been made to the original plan of activities thus far. Some tasks were initiated earlier than anticipated, as italicized in the revised table.  
Original: 

| Task | Team Member(s) | Start | End | \# of Days |
| :---- | :---- | :---- | :---- | :---- |
| **Phase 1 \- Proposal** |  |  |  |  |
| Project Planning and Assignment | All | 1/21/26 | 2/18/26 | 29 |
| Literature Review and Data Collection | All | 2/10/26 | 2/26/26 | 17 |
| Proposal Writing, Editing, and Submission | All | 2/26/26 | 3/6/26 | 9 |
| Proposal Slides and Video | Katherine, Arun | 3/1/26 | 3/6/26 | 6 |
| **Phase 2 \- Midpoint** |  |  |  |  |
| Data Cleaning, EDA, and ACS Join | Sam | 3/7/26 | 3/13/26 | 7 |
| Modeling | Sam, Arun | 3/13/26 | 3/20/26 | 8 |
| Exploratory Visualizations and Charts | Sara, Gabriel | 3/20/26 | 3/27/26 | 8 |
| Progress Report | Meghan, Sara | 3/27/26 | 4/3/26 | 8 |
| **Phase 3 \- Final** |  |  |  |  |
| UI Development and Model Integration | Katherine, Sam, Sara | 4/7/26 | 4/12/26 | 6 |
| Model Finalization and Equity Analysis | Sam, Arun | 4/12/26 | 4/17/26 | 6 |
| Poster Design and Presentation | Sara, Gabriel, All | 4/13/26 | 4/24/26 | 12 |
| Final Report Writing and Support | Arun, Meghan | 4/13/26 | 4/20/26 | 8 |
| Edits, Proofreading, and Final Submission | All | 4/20/26 | 4/24/26 | 5 |

Revised: 

| Task | Team Member(s) | Start | End | \# of Days |
| :---- | :---- | :---- | :---- | :---- |
| **Phase 1 \- Proposal** |  |  |  |  |
| Project Planning and Assignment | All | 1/21/26 | 2/18/26 | 29 |
| Literature Review and Data Collection | All | 2/10/26 | 2/26/26 | 17 |
| Proposal Writing, Editing, and Submission | All | 2/26/26 | 3/6/26 | 9 |
| *Proposal Slides and Video* | *Katherine, Arun* | *3/1/26* | *3/5/26* | *5* |
| **Phase 2 \- Midpoint** |  |  |  |  |
| *Data Cleaning, EDA, and ACS Join* | *Sam* | *3/6/26* | *3/13/26* | *8* |
| Modeling | Sam, Arun | 3/13/26 | 3/20/26 | 8 |
| *Exploratory Visualizations and Charts* | *Sara, Gabriel* | *3/19/26* | *3/29/26* | *10* |
| *Progress Report* | *Meghan, Sara* | *3/20/26* | *4/3/26* | *15* |
| **Phase 3 \- Final** |  |  |  |  |
| UI Development and Model Integration | Katherine, Sam, Sara | 4/7/26 | 4/12/26 | 6 |
| Model Finalization and Equity Analysis | Sam, Arun | 4/12/26 | 4/17/26 | 6 |
| Poster Design and Presentation | Sara, Gabriel, All | 4/13/26 | 4/24/26 | 12 |
| Final Report Writing and Support | Arun, Meghan | 4/13/26 | 4/20/26 | 8 |
| Edits, Proofreading, and Final Submission | All | 4/20/26 | 4/24/26 | 5 |

**Summary of Effort Distribution:** All team members continue to contribute a comparable level of effort across all activities. Responsibilities have been evenly distributed among the three phases \- proposal, progress, and final.

**References**   
\[1\] Brazil, N. (2018). The Unequal Spatial Distribution of City Government Fines. *Urban Affairs Review,* 56(3), 823–856.   
\[2\] Brazil, N., Vang, B., & Abdelnur, H. (2024). Neighborhood inequality in government fines: 16 U.S. cities. *Cities*, 152, 105229\.   
\[3\] Wo, J. C., Kim, Y. A., & Malone, S. E. (2025). Examining the spatial distribution of parking tickets in San Francisco. *Journal of Urban Affairs*, 47(5), 1709–1740.   
\[4\] Li, J., Sun, Q., Zhao, L., & Li, C. (2021). Spatio-temporal characteristics of urban on-street parking violations. *Journal of Transport Geography*, 94, 103117\.   
\[5\] Delialis, P., Iliopoulou, C., Karountzos, O., & Kepaptsoglou, K. (2025). Where’s the Ticket? Identifying Spatio-Temporal Patterns of Parking Violations with Crowdsourced Web-GIS Data. *Applied Spatial Analysis and Policy*, 18, 16\.   
\[6\] Schultheiss, M., Pattaroni, L., & Kaufmann, V. (2024). Planning urban proximities. *Cities*, 152, 105215\.   
\[7\] Borowska-Stefańska, M., Lamprecht, M., Turoboś, F., & Wiśniewski, S. (2025). Patterns of temporal and spatial variability of parking in Łódź, Poland. *Journal of Transport Geography*, 126, 104236\.   
\[8\] Ambo, T. B., Ma, J., & Fu, C. (2021). Investigating influence factors of traffic violation using multinomial logit. *International Journal of Injury Control*, 28(1), 78–85.   
\[9\] Akhawaji, R., Sedky, M., & Soliman, A. H. (2017). Illegal Parking Detection Using GMM and Kalman Filter. *IEEE/ACS AICCSA*, 840–847.   
\[10\] Anselin, L. (2022). Spatial econometrics. In the *Handbook of Spatial Analysis in the Social Sciences*. Edward Elgar.   
\[11\] Garcia-Zanabria, G. (2021). CriPAV: Street-level crime patterns analysis and visualization. IEEE *Transactions on Visualization and Computer Graphics*, 28(12), 4000–4015.   
\[12\] Maciejewski, R. (2010). A visual analytics approach to understanding spatiotemporal hotspots. IEEE *Transactions on Visualization and Computer Graphics*, 16(2), 205–220.   
\[13\] Miranda, F. (2024). The State of the Art in Visual Analytics for 3D Urban Data. *Computer Graphics Forum.*   
\[14\] Butt, U. M. (2020). Spatio-Temporal Crime HotSpot Detection and Prediction: A Systematic Literature Review. *IEEE Access.*   
\[15\] Chainey, S., Tompson, L., & Uhlig, S. (2008). The Utility of Hotspot Mapping for Predicting Spatial Patterns of Crime. *Security Journal*, 21(1–2), 4–28.   
\[16\] Meijer, A., & Wessels, M. (2019). Predictive Policing: Review of Benefits and Drawbacks. *International Journal of Public Administration*, 42(12), 1031–1039.   
\[17\] Rotaru, V. (2022). Event-level Prediction of Urban Crime Reveals Signature of Enforcement Bias in U.S. Cities. *Nature Human Behaviour*.   
\[18\] Chen, Z., Guo, Y., Stuart, A., Zhang, Y., & Li, X. (2025). Spatio-temporal heterogeneity in street illegal parking: A case study in New York. *Journal of Transport Geography*, 127, 104262\.  
\[19\] Mohler, G. O., Short, M. B., Malinowski, S., Johnson, M., Tita, G. E., Bertozzi, A. L., & Brantingham, P. J. (2015). Randomized Controlled Field Trials of Predictive Policing. *Journal of the American Statistical Association*, 110(512), 1399–1411.   
\[20\] Passport. (2026). 2025 Parking Compliance Trends Report. passportinc.com