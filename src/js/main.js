let memoryList = ["rss","vms","num_page_faults","peak_wset","wset","peak_paged_pool","paged_pool","peak_nonpaged_pool","nonpaged_pool","pagefile","peak_pagefile","private"];
let memoryList_chart = ["rss","vms","wset","pagefile","private"];
Promise.all([
    d3.csv('umap_measure.csv'),
    d3.csv('isomap_measure.csv'),
    d3.csv('umap_isomap_measure.csv')
]).then(([umapd,isomap_d,both_d])=>{
    data = [
        {key:'umap',value:fixData(umapd)},
        {key:'isomap',value:fixData(isomap_d)},
        {key:'asynchronous',value:fixData(both_d)},
    ];
    // memory -sum
    let memorys = data.map(d=>{
        let temp = {algorithm:d.key};
        d.value['memory'].forEach(e=>{
            if(memoryList_chart.find(l=>l===e.key))
                temp[e.key] = e.value;
        });
        return temp;
    });
    let sums = {algorithm:'stack umap and isomap'};
    d3.keys(memorys[1]).forEach(k=>{
        if (k!=='algorithm')
            sums[k] = memorys[1][k]+memorys[0][k]
    })
    memorys.push(sums)
    draw(d3.select('#memory'),memorys);

    // mem peak
    let memorypeak = data.map(d=>{
        let temp = {algorithm:d.key};
        d.value['memory'].forEach(e=>{
            if(e.key.includes('pool'))
                temp[e.key] = e.value;
        });
        return temp;
    });
    sums = {algorithm:'stack umap and isomap'};
    d3.keys(memorypeak[1]).forEach(k=>{
        if (k!=='algorithm')
            sums[k] = memorypeak[1][k]+memorypeak[0][k]
    })
    memorypeak.push(sums)
    draw(d3.select('#memorypeak'),memorypeak);

    // pagefaul
    let pagefault = data.map(d=>{
        let temp = {algorithm:d.key};
        d.value['memory'].forEach(e=>{
            if('num_page_faults'===e.key)
                temp[e.key] = e.value;
        });
        return temp;
    });
    sums = {algorithm:'stack umap and isomap'};
    d3.keys(pagefault[1]).forEach(k=>{
        if (k!=='algorithm')
            sums[k] = pagefault[1][k]+pagefault[0][k]
    })
    pagefault.push(sums)
    draw(d3.select('#pagefault'),pagefault);

    // cpu_percent
    let cpu_percent = data.map(d=>{
        let temp = {algorithm:d.key};
        d.value['cpu_percent'].forEach(e=>{
                temp[e.key] = e.value;
        });
        return temp;
    });

    draw(d3.select('#cpu_percent'),cpu_percent,100);
    console.log(data)
});
d3.csv('umap_measure.csv').then(d=>(data['umap'] = fixData(d)))

function fixData(d){
    d.forEach(e=>e.cpu_times = e.cpu_times.split('(')[1].split(')')[0].split(',').map(e=>(f=e.split('='),{key:f[0].trim(),value:[f[1][0]]})))
    let temp = {};
    let lastIndex = d.length-1;
    temp['memory'] = memoryList.map(e=>({key:e,value:e.includes('peak')?+d[lastIndex][e]: +d[lastIndex][e]- +d[0][e]}));
    temp['cpu_times'] = d[0].cpu_times.map((e,ei)=>({key:e.key, value: +d[lastIndex].cpu_times[ei].value- +d[0].cpu_times[ei].value}));
    temp['cpu_percent'] = [{key:'cpu_percent',value:+d[lastIndex].cpu_percent- +d[0].cpu_percent}];
    return temp;
}

function bytesToString(bytes) {
    // One way to write it, not the prettiest way to write it.

    var fmt = d3.format('.0f');
    if (bytes < 1024) {
        return fmt(bytes) + 'B';
    } else if (bytes < 1024 * 1024) {
        return fmt(bytes / 1024) + 'kB';
    } else if (bytes < 1024 * 1024 * 1024) {
        return fmt(bytes / 1024 / 1024) + 'MB';
    } else {
        return fmt(bytes / 1024 / 1024 / 1024) + 'GB';
    }
}

function draw(svg,data,limit){
    groupKey = 'algorithm';
    width = 700;
    height = 400;
    margin = ({top: 10, right: 10, bottom: 20, left: 40})
    keys = Object.keys(data[0]).filter(d=>d!==groupKey)
    color = d3.scaleOrdinal()
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"])
    x0 = d3.scaleBand()
        .domain(data.map(d => d[groupKey]))
        .rangeRound([margin.left, width - margin.right])
        .paddingInner(0.1);

    x1 = d3.scaleBand()
        .domain(keys)
        .rangeRound([0, x0.bandwidth()])
        .padding(0.05);

    y = d3.scaleLinear()
        .domain([limit?limit:0, d3.max(data, d => d3.max(keys, key => d[key]))]).nice()
        .rangeRound([height - margin.bottom, margin.top]);
    xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x0).tickSizeOuter(0))
        .call(g => g.select(".domain").remove())
    yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(null, "s"))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("x", 3)
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text(data.y))
    legend = svg => {
        const g = svg
            .attr("transform", `translate(${width},0)`)
            .attr("text-anchor", "end")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .selectAll("g")
            .data(color.domain().slice().reverse())
            .join("g")
            .attr("transform", (d, i) => `translate(0,${i * 20})`);

        g.append("rect")
            .attr("x", -19)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", color);

        g.append("text")
            .attr("x", -24)
            .attr("y", 9.5)
            .attr("dy", "0.35em")
            .text(d => d);
    }

    svg.attr('width',width).attr('height',height)

    svg.append("g")
        .selectAll("g")
        .data(data)
        .join("g")
        .attr("transform", d => `translate(${x0(d[groupKey])},0)`)
        .selectAll("rect")
        .data(d => keys.map(key => ({key, value: d[key]})))
        .join("rect")
        .attr("x", d => x1(d.key))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => y(0) - y(d.value))
        .attr("fill", d => color(d.key));

    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);

    svg.append("g")
        .call(legend);
}