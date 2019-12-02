import React, { Component } from "react";
import "./drawsignal.css"
import * as d3 from "d3"
// import * as _ from "lodash"
import { Button } from "carbon-components-react"

class DrawSignal extends Component {
    constructor(props) {
        super(props)

        this.state = {
            signalExtracted: false
        }

        this.chartWidth = 600
        this.chartHeight = 300

        this.smallChartWidth = 150
        this.smallChartHeight = 50

        this.prevX = 0
        this.currX = 0
        this.prevY = 0
        this.currY = 0
        this.dot_flag = false;

        this.strokeColor = "black"
        this.lineWidth = 2
        this.flag = false

        this.drawMap = new Map()
        this.signalCount = 140
        this.pointColors = []
    }

    componentDidMount() {

        this.refs.drawsignaloutcanvas.width = this.smallChartWidth
        this.refs.drawsignaloutcanvas.height = this.smallChartHeight
        this.smallChartContext = this.refs.drawsignaloutcanvas.getContext('2d')

        // console.log("Line component mounted")
        this.largeChartCanvas = this.refs.drawsignalcanvas
        this.largeChartCanvas.width = this.chartWidth
        this.largeChartCanvas.height = this.chartHeight;
        this.largeChartContext = this.largeChartCanvas.getContext('2d')

        this.largeChartCanvas.addEventListener("mousedown", this.mouseDownEvent.bind(this))
        // this.largeChartCanvas.addEventListener("touchstart", this.mouseDownEvent.bind(this))

        this.largeChartCanvas.addEventListener("mouseup", this.mouseUpEvent.bind(this))
        this.largeChartCanvas.addEventListener("mousemove", this.mouseMoveEvent.bind(this))
        // this.largeChartCanvas.addEventListener("touchmove", this.mouseMoveEvent.bind(this))
        this.largeChartCanvas.addEventListener("mouseout", this.mouseOutEvent.bind(this))

    }

    draw() {


        this.largeChartContext.beginPath();
        this.largeChartContext.moveTo(this.prevX, this.prevY);
        this.largeChartContext.lineTo(this.currX, this.currY);
        this.largeChartContext.strokeStyle = this.strokeColor;
        this.largeChartContext.lineWidth = this.lineWidth;
        this.largeChartContext.stroke();
        this.largeChartContext.closePath();
        // console.log(this.currX, this.currY);

        if (!this.drawMap.has(this.currX)) {
            this.drawMap.set(this.currX, this.currY)

        }

    }



    findxy(res, e) {
        if (res === 'down') {
            this.prevX = this.currX;
            this.prevY = this.currY;
            this.currX = e.clientX - this.largeChartCanvas.offsetLeft;
            this.currY = e.clientY - this.largeChartCanvas.offsetTop;

            this.flag = true;
            this.dot_flag = true;
            if (this.dot_flag) {
                this.largeChartContext.beginPath();
                this.largeChartContext.fillStyle = this.strokeColor;
                this.largeChartContext.fillRect(this.currX, this.currY, 2, 2);
                this.largeChartContext.closePath();
                this.dot_flag = false;
            }
        }
        if (res === 'up') {
            this.flag = false;
            this.miniGraph()
        }
        if (res === "out") {
            this.flag = false;
        }
        if (res === 'move') {
            if (this.flag) {
                this.prevX = this.currX;
                this.prevY = this.currY;
                this.currX = e.clientX - this.largeChartCanvas.offsetLeft;
                this.currY = e.clientY - this.largeChartCanvas.offsetTop;
                this.draw();
            }
        }
    }

    componentDidUpdate(prevProps, prevState) {


    }

    // touchDownEvent(e) {

    // }

    // touchUpEvent(e) {

    // }

    // touchMoveEvent(e) {

    // }
    // touchOutEvent(e) {

    // }



    mouseDownEvent(e) {
        this.findxy('down', e)
    }
    mouseUpEvent(e) {
        this.findxy('up', e)
    }
    mouseMoveEvent(e) {
        this.findxy('move', e)
    }
    mouseOutEvent(e) {
        this.findxy('out', e)
    }


    componentWillUnmount() {
        this.largeChartCanvas.removeEventListener("mousedown", this.mouseDownEvent)
        this.largeChartCanvas.removeEventListener("mouseup", this.mouseUpEvent)
        this.largeChartCanvas.removeEventListener("mouseover", this.mouseMoveEvent)
        this.largeChartCanvas.removeEventListener("mouseout", this.mouseOutEvent)
    }

    miniGraph() {
        if (this.drawMap.size > 0) {
            this.drawGraph(this.drawMap)
        }
    }

    clearDrawing() {

        this.largeChartContext.clearRect(0, 0, this.chartWidth, this.chartHeight);
        this.smallChartContext.clearRect(0, 0, this.smallChartWidth, this.smallChartHeight);

        this.drawMap = new Map()
        this.setState({ signalExtracted: false })
    }

    rangeMean(i, start, end, prevMean, data) {
        let sum = 0
        let count = 0
        for (let i = start; i <= end; i++) {
            if (data.get(i * 1)) {
                sum += data.get(i * 1)
                count++
            }
        }

        let rangeMean = sum / count
        this.pointColors[i] = "blue"
        if (count === 0) {
            rangeMean = prevMean
            this.pointColors[i] = "orange"
        }

        // console.log(start, end, sum, count, rangeMean);
        return rangeMean
    }
    drawGraph(data) {

        let canv = this.refs.drawsignaloutcanvas
        let context = canv.getContext("2d")

        this.smallChartContext.clearRect(0, 0, this.chartWidth, this.chartWidth);

        // context.translate(0, this.chartHeight);
        // context.scale(1, -1);

        let prevMean = data.values().next().value
        let curMean = 0
        let signalHolder = []

        let step = (this.chartWidth / this.signalCount)
        for (let i = 0; i < this.signalCount; i++) {
            curMean = this.rangeMean(i, Math.floor(i * step), Math.floor(i * step + step), prevMean, data)
            signalHolder[i] = curMean
            prevMean = curMean
        }
        this.setState({ signalExtracted: true })

        this.xScale = d3.scaleLinear()
            .domain([0, signalHolder.length - 1]) // input
            .range([0, this.smallChartWidth]); // output


        this.yScale = d3.scaleLinear()
            .domain([d3.min(signalHolder), d3.max(signalHolder)]) // input 
            .range([0, this.smallChartHeight]); // output


        // console.log(signalHolder);
        let prevX = 0, prevY = signalHolder[0]
        let currX = 0, currY = 0
        for (let i = 1; i < signalHolder.length; i++) {
            currX = i
            currY = signalHolder[i] || signalHolder[i - 1]
            context.beginPath();
            context.moveTo(this.xScale(prevX), this.yScale(prevY));
            context.lineTo(this.xScale(currX), this.yScale(currY));
            context.strokeStyle = this.pointColors[i]
            context.lineWidth = this.lineWidth;
            context.stroke();
            context.closePath();
            prevX = currX
            prevY = currY

        }
    }


    render() {
        return (
            <div style={{ width: this.chartWidth + 25 }} className="mt2 border p10">

                <div className="border ml10 mt10 unclickable positionabsolute p10 smallchartbox " >
                    <canvas className="" ref="drawsignaloutcanvas" id="drawsignalcanvas"></canvas>
                    <div className={"smalldesc extractedsignal pt5 " + (this.state.signalExtracted ? " " : " displaynone")}> Extracted signal </div>
                    {/* <div className={"smalldesc pt5 " + (this.state.signalExtracted ? " " : " displaynone")}> draw signal </div> */}
                </div>
                <div className="">
                    <canvas className="border iblock largechart" ref="drawsignalcanvas" id="drawsignalcanvas"></canvas>
                </div>

                <div className="pt5">
                    <Button
                        size={"small"}
                        renderIcon={null}
                        onClick={this.clearDrawing.bind(this)}
                    > Clear Drawing </Button>
                </div>
                <div className="p5 iblock mediumdesc">
                    Click and drag to draw a signal. Please draw within the box.
                </div>
            </div>
        )
    }
}

export default DrawSignal