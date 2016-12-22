import React from 'react';
import ReactDOM from 'react-dom';

var style = require('./style.scss');

import {observable, autorun} from "mobx";

import {observer} from "mobx-react";

import fetchJSONP from "fetch-jsonp"

import _ from "underscore";

import moment from "moment"

window.moment = moment;

var getTime = function(s) {
  return moment(s, 'DD/MM/YYYY').toDate().getTime();
}

var customTimeFormat = d3.time.format.multi([
  [".%L", function(d) { return d.getMilliseconds(); }],
  [":%S", function(d) { return d.getSeconds(); }],
  ["%I:%M", function(d) { return d.getMinutes(); }],
  ["%I %p", function(d) { return d.getHours(); }],
  ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
  ["%b %d", function(d) { return d.getDate() != 1; }],
  ["%B", function(d) { return d.getMonth(); }],
  ["%Y", function() { return true; }]
]);

const randomDataSet = () => {
  return {
    beginning : getTime('01/01/2010'),
    ending: getTime('01/01/2019'),
    points: [
      {"beginning": getTime('01/05/2010'), "ending": getTime('02/06/2010'), img: 'http://lorempixel.com/400/200/', title: 'kaki'},
      {"beginning": getTime('02/06/2011'), "ending": getTime('03/07/2011'), img: 'http://lorempixel.com/400/200/', title: 'popo'}
    ],
    windowwidth: 100
  }
}

export default class Axis extends React.Component {
  componentDidUpdate() {
    this.renderAxis();
  }

  componentDidMount() {
    this.renderAxis();
  }

  animate() {
    console.log('animating', this.props.id, this.props.newscale);
    var newscale = this.props.newscale;
    
    var that = this;
    
    var axis = d3.svg.axis()
		 .orient('bottom')
		 .ticks(this.props.tickTime, 1)
		 .scale(newscale)
		 .tickFormat(this.props.format)

    
    var axis2 = d3.svg.axis()
		  .orient('bottom')
		  .ticks(this.props.tickTime, 1)
		  .scale(newscale)
		  .tickFormat("")
      		  .tickSize(that.props.height, 0, 0);
    
    d3.select(this.refs.axis).transition()
		  .each("end", function(){
		    that.props.onZoom(newscale);
		  })
		  .duration(750).call(axis);
    

    d3.select(this.refs.timeaxis).transition().duration(750).call(axis2);


    d3.selectAll('#' + this.props.id + ' .point').transition().duration(750).attr('x', function(r){
      return newscale(that.props.scale.invert(this.x.baseVal.value))
    });

    d3.selectAll('#' + this.props.id + ' .box').transition().duration(750).attr('x', function(r){
      return newscale(that.props.scale.invert(this.x.baseVal.value))
    });
  }

  renderAxis() {
    var that = this;
    
    var axis = d3.svg.axis()
		 .orient('bottom')
		 .ticks(this.props.tickTime, 1)
		 .scale(this.props.scale)
		 .tickFormat(this.props.format)

    var axis2 = d3.svg.axis()
		  .orient('bottom')
		  .ticks(this.props.tickTime, 1)
		  .scale(this.props.scale)
		  .tickFormat("")
      		  .tickSize(that.props.height, 0, 0)

    
    
    var xzoom = d3.behavior.zoom()
		  .x(this.props.scale)
		  .on("zoom", function(){
		    console.log('zoom', that.props.scale.invert(that.props.width / 2));
		    that.props.onZoom && that.props.onZoom(that.props.scale);
		  });

    var bg = d3.select(this.refs.bg)
	       .on('click', function(){
		 console.log('click', d3.event.defaultPrevented)
		 if (d3.event.defaultPrevented) return; // dragged

		 var svg = d3.select('svg');
		 var x = d3.mouse(this)[0];

		 var dx = x - that.props.width / 2 ;
		 var beginning = that.props.scale.invert(dx);
		 var ending = that.props.scale.invert(that.props.width + dx);
		 console.log('click bg, new dx, beg, end', dx, beginning, ending, xzoom.event);
		 var newscale = d3.time
				  .scale()
				  .domain([beginning, ending])
				  .range([0, that.props.width]);

		 
		 that.props.animateTo(newscale);

		 
	       });

    d3.select(this.refs.axis).call(axis);

    d3.select(this.refs.timeaxis).call(axis2);

    d3.select('#' + this.props.id).call(xzoom);

    if (this.props.newscale) {
	that.animate();
    }
    
  }

  render() {
    var that = this;
    var rects = this.props.data.points;
    var rectheight = that.props.big ? 10 : 2;
    rects = rects.map(function(p,i){
      var objprops = {
	x: that.props.scale(p.beginning),
	y:  -(that.props.height / 2) + (p.offset * rectheight*2 || 0),
	key: 'obj_' + i
      };

      var rw = that.props.scale(p.ending) - that.props.scale(p.beginning);
      
      var rectprops = {
	...objprops,
	width: rw > 10 ? rw : 10,
	height:rectheight,
	key:'rect_' + i
      };

      var imgprops = {
	...objprops,
	width:100,
	key: 'img_' + i
      };
      
      return (
	<g className="boxwrap" key={"gg_" + i}>
	{p.img && that.props.big ?
	 (<foreignObject className="box" {...objprops}>
	   <div className="infobox">
	   <h4>{p.title || 'HEADLINE'}</h4>
	   <div className="text">{p.text || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas at lobortis arcu, id mollis magna. Nunc vel lectus nulla.'}</div>
	   <img {...imgprops} src={p.img} />
	   <a className="link" href={p.link || 'http://cat.com'} target="_blank">read more</a>
	   </div>
	    </foreignObject>)
	    : null}
	<rect className="point" onClick={()=>(console.log(p))} {...rectprops}>
	</rect>
	</g>
      )
    });
    
    return (
      <g id={this.props.id} transform={'translate(0, ' + (this.props.mtop) + ')'}>
      {!this.props.big ? <rect className="window" stroke="black" y={-that.props.padding} x={$(window).width()/2 - that.props.data.windowwidth/2} fill="transparent" width={that.props.data.windowwidth} height={this.props.height} ></rect> : null}
      <rect className="bg" ref="bg" width="100%" height={this.props.height} transform={'translate(0, ' + -this.props.padding + ')'} x="0" y="0"></rect>
      <g className="axis timeaxis" ref="timeaxis"  strokeDasharray="10 10" transform={'translate(0, ' + -this.props.padding + ')'}></g>
      <g className="axis" ref="axis" transform={'translate(0, ' + (this.props.height - this.props.padding) + ')'}></g>
      <g className="points" ref="points" transform={'translate(0, ' + ((this.props.height - this.props.padding)) + ')'}>
      {rects}
      </g>
      </g>
    )
  }
}


var Timeline = React.createClass({
  getInitialState: function() {
    return {};
  },
  render() {
    var props = this.props;

    var s1height = 100;
    var s1padding = 20;
    
    var settings2 = {
      id:'axis2',
      width: $(window).width(),
      mtop: 0,
      height: $(window).height() - s1height - s1padding,
      padding: 20,
      format: customTimeFormat,
      tickTime: d3.time.months,
      tickValues: null
    };
    
    var settings1 = {
      id: 'axis1',
      width: $(window).width(),
      mtop:settings2.height + settings2.padding,
      height: s1height,
      padding: s1padding,
      format: customTimeFormat,
      tickTime: d3.time.years,
      tickValues: null
    };


    var domain = [this.props.data.beginning, this.props.data.ending];
    var data = this.props.data;

    var fromScale2ToScale1Domain = function(s2) {
      var domain2 = s2.domain();
      var hscale = d3.time.scale()
		     .domain([domain2[0], domain2[1]])
		     .range([$(window).width()/2-data.windowwidth/2, $(window).width()/2 + data.windowwidth/2]);
      return [hscale.invert(0),hscale.invert($(window).width())];
    }
    
    if (this.state.scale2) {
      domain = fromScale2ToScale1Domain(this.state.scale2);
    }

    if (!this.state.scale1) {
      console.log('new scale 1 domain', domain);
    }
    
      settings1.scale = this.state.scale1 || d3.time.scale()
					       .domain(domain)
					       .range([0, settings1.width]);
      
      settings2.scale = this.state.scale2 || d3.time.scale()
					       .domain([settings1.scale.invert($(window).width() / 2 - data.windowwidth/2), settings1.scale.invert($(window).width() / 2 + data.windowwidth/2)])
					       .range([0, settings2.width]);

    if (this.state.scale1Animate) {
      console.log('scale 1 animate');
      settings1.newscale = this.state.scale1Animate;
      settings2.newscale = d3.time.scale()
			     .domain([settings1.newscale.invert($(window).width() / 2 - data.windowwidth/2), settings1.newscale.invert($(window).width() / 2 + data.windowwidth/2)])
			     .range([0, settings2.width]);
    }

    if (this.state.scale2Animate) {
      console.log('scale 2 animate');
      var domain =  fromScale2ToScale1Domain(this.state.scale2Animate);
      settings1.newscale = d3.time.scale()
			     .domain(domain)
			     .range([0, settings1.width]);  
      settings2.newscale = this.state.scale2Animate;
    }

    return (
      <svg width={$(window).width()} height={$(window).height()} >
      
      
      <Axis big={true} {...settings2} {...this.props}
      onZoom={(scale2)=>{
	this.setState({scale2,scale1:null, scale2Animate:null, scale1Animate:null});}}
      animateTo={(scale2)=>{
	this.setState({scale2Animate: scale2, scale1Animate:null});}}

      />

      <Axis {...settings1} {...this.props}
      
      onZoom={(scale1)=>{
	this.setState({scale1,scale2:null, scale2Animate:null, scale1Animate:null});}}
      
      animateTo={(scale1)=>{
	this.setState({scale1Animate: scale1,scale2Animate:null});}}
      />

      
      </svg>
    );
  }
});



export class App extends React.Component {
  constructor() {
    super();
    this.state = {
      data: randomDataSet()
    };
  }

  componentDidMount() {
    var that = this;
    $(window).resize(function(){
      that.forceUpdate();
    })
  }

  fire() {
    this.state.data.ending += 1000000; 
    this.forceUpdate();
  }

  render() {
    return (
      <div className="timewrap">
      <Timeline {...this.state} />
      </div>
    );
  }
}

ReactDOM.render(<App/>, document.getElementById("myApp"));
