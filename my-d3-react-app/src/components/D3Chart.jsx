import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { addNodeOnClick } from "../Util/addNode";
import ExportButton from "./ExportButton";
import D3Header from "./D3Header"; // Import the D3Header component
import Slider from "./Slider"; // Import the Slider component

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
  const [lastNodeId, setLastNodeId] = useState("C".charCodeAt(0));
  const [mousedownNode, setMousedownNode] = useState(null);
  const [forceStrength, setForceStrength] = useState(-500); // State for force strength

  useEffect(() => {
    const svg = d3.select(d3Container.current);

    const dragLine = svg
      .append("path")
      .attr("class", "link dragline hidden")
      .attr("d", "M0,0L0,0")
      .style("marker-end", "url(#end-arrow)");

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
        .force("charge", d3.forceManyBody().strength(forceStrength)) // Use the forceStrength state
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
        .attr("stroke", "#999")
        .attr("marker-end", "url(#end-arrow)");

      const node = svg
        .append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", 12)
        .attr("fill", "#69b3a2")
        .on("mousedown", (event, d) => {
          if (event.ctrlKey) return;
          setMousedownNode(d);
          dragLine
            .classed("hidden", false)
            .attr("d", `M${d.x},${d.y}L${d.x},${d.y}`);
        })
        .on("mouseup", (event, d) => {
          if (!mousedownNode) return;

          dragLine.classed("hidden", true);

          const newLink = {
            source: mousedownNode.id,
            target: d.id,
            left: false,
            right: true,
          };
          setLinks([...links, newLink]);
          setMousedownNode(null);
          updateGraph();
        })
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

      svg.on("mousemove", function (event) {
        if (!mousedownNode) return;

        const [x, y] = d3.pointer(event);
        dragLine.attr("d", `M${mousedownNode.x},${mousedownNode.y}L${x},${y}`);
      });

      svg.on("mouseup", function () {
        if (mousedownNode) {
          dragLine.classed("hidden", true);
          setMousedownNode(null);
        }
      });

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
  }, [width, height, nodes, links, mousedownNode, forceStrength]);

  return (
    <div>
      <D3Header svgRef={d3Container} width={width} height={height} />{" "}
      {/* Use the D3Header component */}
      <Slider value={forceStrength} onChange={setForceStrength} />{" "}
      {/* Use the Slider component */}
      <svg ref={d3Container}></svg>
      <ExportButton svgRef={d3Container} />{" "}
      {/* Use the ExportButton component */}
    </div>
  );
};

export default D3Chart;
