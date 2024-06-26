import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { toPng } from "html-to-image";
import { addNodeOnClick } from "../Util/addNode";

const D3Chart = ({ width, height }) => {
  const d3Container = useRef(null);
  const [nodes, setNodes] = useState([
    { id: "A", reflexive: false },
    { id: "B", reflexive: false },
    { id: "C", reflexive: false },
  ]);
  const [links, setLinks] = useState([
    { source: "A", target: "B", left: false, right: true },
    { source: "B", target: "C", left: false, right: true },
  ]);

  useEffect(() => {
    const svg = d3
      .select(d3Container.current)
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid black");

    const updateGraph = () => {
      svg.selectAll("*").remove();

      const simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3
            .forceLink(links)
            .id((d) => d.id)
            .distance(150)
        )
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", ticked);

      const link = svg
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke-width", 2)
        .attr("stroke", "#999");

      const node = svg
        .append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", 12)
        .attr("fill", "#69b3a2")
        .call(
          d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );

      const label = svg
        .append("g")
        .attr("class", "labels")
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("dx", 15)
        .attr("dy", 4)
        .text((d) => d.id);

      function ticked() {
        link
          .attr("x1", (d) => getNodePosition(d.source, "x"))
          .attr("y1", (d) => getNodePosition(d.source, "y"))
          .attr("x2", (d) => getNodePosition(d.target, "x"))
          .attr("y2", (d) => getNodePosition(d.target, "y"));

        node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

        label.attr("x", (d) => d.x).attr("y", (d) => d.y);
      }

      function getNodePosition(id, axis) {
        const node = nodes.find((node) => node.id === id);
        return node ? node[axis] : 0;
      }

      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      addNodeOnClick(svg, nodes, setNodes, links, setLinks);

      return () => {
        svg.selectAll("*").remove();
        simulation.stop();
      };
    };

    const cleanup = updateGraph();

    return () => {
      if (cleanup) cleanup();
    };
  }, [width, height, nodes, links]);

  const exportAsPng = () => {
    if (d3Container.current) {
      toPng(d3Container.current)
        .then((dataUrl) => {
          const link = document.createElement("a");
          link.download = "d3-chart.png";
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error("Failed to export as PNG", err);
        });
    }
  };

  return (
    <div>
      <svg ref={d3Container}></svg>
      <button onClick={exportAsPng}>Export as PNG</button>
    </div>
  );
};

export default D3Chart;
