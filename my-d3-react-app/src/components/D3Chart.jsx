import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { addNodeOnDblClick } from "../Util/addNodeOnDblClick";
import ExportButton from "./ExportButton";
import D3Header from "./D3Header";
import RemoveButton from "./RemoveButton";
import styled from "styled-components";

const DivColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: start;
`;

const DivRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const D3Chart = ({ width, height, strength }) => {
  const d3Container = useRef(null);
  const [nodes, setNodes] = useState([
    { id: "A", reflexive: false, label: "A", x: width / 3, y: height / 2 },
    { id: "B", reflexive: false, label: "B", x: width / 2, y: height / 2 },
    { id: "C", reflexive: false, label: "C", x: (2 * width) / 3, y: height / 2 },
  ]);
  const [links, setLinks] = useState([
    { source: "A", target: "B", left: false, right: true },
    { source: "B", target: "C", left: false, right: true },
  ]);
  const [lastNodeId, setLastNodeId] = useState("C".charCodeAt(0));
  const [mousedownNode, setMousedownNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    const svg = d3.select(d3Container.current);

    const dragLine = svg
      .append("path")
      .attr("class", "link dragline hidden")
      .attr("d", "M0,0L0,0")
      .style("marker-end", "url(#end-arrow)");

    svg.on("mousemove", handleMouseMove(dragLine));
    svg.on("mouseup", handleMouseUp(dragLine));

    addNodeOnDblClick(
      svg,
      nodes,
      setNodes,
      links,
      setLinks,
      lastNodeId,
      setLastNodeId,
      width,
      height
    );

    const cleanup = updateGraph(svg, nodes, links, dragLine, width, height, strength);

    return () => {
      if (cleanup) cleanup();
    };
  }, [width, height, strength, lastNodeId]);

  useEffect(() => {
    const svg = d3.select(d3Container.current);
    svg.selectAll("*").remove();
    updateGraph(svg, nodes, links, null, width, height, strength);
  }, [nodes, links]);

  const updateGraph = (svg, nodes, links, dragLine, width, height, strength) => {
    const link = createLinks(svg, links);
    const node = createNodes(svg, nodes, dragLine);

    const simulation = createSimulation(nodes, links, width, height, strength, () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    simulation.alpha(1).restart();

    return () => {
      svg.selectAll("*").remove();
      simulation.stop();
    };
  };

  const createSimulation = (nodes, links, width, height, strength, ticked) => {
    return d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(150)
      )
      .force("charge", d3.forceManyBody().strength(-strength))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", ticked);
  };

  const createLinks = (svg, links) => {
    return svg
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke-width", 2)
      .attr("stroke", "#999")
      .attr("marker-end", "url(#end-arrow)");
  };

  const createNodes = (svg, nodes, dragLine) => {
    const node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    const foreignObject = node
      .append("foreignObject")
      .attr("width", 100)
      .attr("height", 30)
      .append("xhtml:div")
      .style("font", "14px 'Helvetica Neue'")
      .style("background", "transparent")
      .style("border", "none")
      .html((d) => `<input type='text' value='${d.label}' style='width: 100%; background: transparent; border: none;' />`);

    foreignObject
      .on("mousedown", (event, d) => handleMouseDown(event, d, dragLine))
      .on("mouseup", (event, d) => handleMouseUpNode(event, d, dragLine))
      .on("click", (event, d) => handleClick(event, d))
      .select("input")
      .each(function(d) {
        d3.select(this).on("blur", (event) => handleInputBlur(event, d));
      });

    return node;
  };

  const handleInputBlur = (event, d) => {
    const newLabel = event.target.value;
    setNodes((nodes) =>
      nodes.map((node) => (node.id === d.id ? { ...node, label: newLabel } : node))
    );
    d.label = newLabel; // Update the D3 node data
    d3.select(event.target).node().value = newLabel; // Update the displayed value
  };

  const handleMouseMove = (dragLine) => (event) => {
    if (!mousedownNode) return;

    const [x, y] = d3.pointer(event);
    dragLine.attr("d", `M${mousedownNode.x},${mousedownNode.y}L${x},${y}`);
  };

  const handleMouseUp = (dragLine) => () => {
    if (mousedownNode) {
      dragLine.classed("hidden", true);
      setMousedownNode(null);
    }
  };

  const handleMouseDown = (event, d, dragLine) => {
    if (event.ctrlKey) return;
    if (!dragLine) return;
    setMousedownNode(d);
    dragLine
      .classed("hidden", false)
      .attr("d", `M${d.x},${d.y}L${d.x},${d.y}`);
  };

  const handleMouseUpNode = (event, d, dragLine) => {
    if (!mousedownNode) return;
    if (!dragLine) return;

    dragLine.classed("hidden", true);

    const newLink = {
      source: mousedownNode,
      target: d,
      left: false,
      right: true,
    };
    setLinks((links) => [...links, newLink]);
    setMousedownNode(null);
  };

  const handleClick = (event, d) => {
    if (selectedNode === null) {
      setSelectedNode(d);
    } else {
      const newLink = {
        source: selectedNode,
        target: d,
        left: false,
        right: true,
      };
      setLinks((links) => [...links, newLink]);
      setSelectedNode(null);
    }
  };

  const dragstarted = (event, d) => {
    if (!event.active) event.subject.fx = event.subject.x;
    if (!event.active) event.subject.fy = event.subject.y;
  };

  const dragged = (event, d) => {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  };

  const dragended = (event, d) => {
    if (!event.active) event.subject.fx = null;
    if (!event.active) event.subject.fy = null;
  };

  const removeLastNode = () => {
    if (nodes.length > 1) {
      const newNodes = nodes.slice(0, -1);
      const newLinks = links.filter(
        (link) =>
          link.source.id !== nodes[nodes.length - 1].id &&
          link.target.id !== nodes[nodes.length - 1].id
      );
      setNodes(newNodes);
      setLinks(newLinks);
      setLastNodeId(lastNodeId - 1);
    }
  };

  return (
    <DivColumn>
      <D3Header svgRef={d3Container} width={width} height={height} />
      <svg ref={d3Container} width={width} height={height}></svg>
      <DivRow>
        <ExportButton svgRef={d3Container} />
        <RemoveButton onClick={removeLastNode} />
      </DivRow>
    </DivColumn>
  );
};

export default D3Chart;
