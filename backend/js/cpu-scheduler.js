//combining all properties related to Output section
class Output {
	constructor() {
		this.o_pid = [];
		this.o_arrivaltime = [];
		this.o_bursttime = [];
		this.o_priority = [];
		this.completionTime = [];
		this.turnAroundTime = [];
		this.waitingTime = [];
		this.avgWait = 0;
		this.avgtat = 0;
		this.utilization = 0;
		this.quantum = 0;
		this.algorithm = '';
	}
}

//   var finalOutputobj = new finalOutput();
var mainOutput = new Output();

var processTotal;
var Selectedalgorithm;
var tq;


$(document).ready(function () {

	$('#explanation-equation').hide();



	$(".priority").collapse({ toggle: false });


	//default algorithm is First Come First Served
	var algorithm = "FCFS";

	//used to keep track of how long the CPU has been running as opposed to idle
	var runningTime = 0;

	//the time it takes to switch between processes
	var contexSwitch = 0;

	//array used to store the processes
	var processArray = [];

	//the time quantum used in Round Robin
	var timeQuantum = 2;

	//the amount of processes, this is used to load in values into processArray
	var processCount = 5;

	//used to keep track of the position
	var position = 0;

	//things are put into here to display
	var bar = new progressBar();

	//set up program initially
	run();

	setTimeout(function () { run() }, 200);

	function findSmallestBurstIndex() {
		var smallestIndex = 0;
		var smallestBurst = 0;

		//finds an initial burst time
		for (var i = 0; i < processArray.length; i++) {
			if (processArray[i].done == false && processArray[i].arrivalTime <= position) {
				smallestIndex = i;
				smallestBurst = processArray[i].burstTime;
				break;
			}
		}

		//looks through the array to find a smaller burst time
		for (var i = smallestIndex; i < processArray.length; i++) {
			if (processArray[i].burstTime < smallestBurst && processArray[i].done == false && processArray[i].arrivalTime <= position) {
				smallestIndex = i;
				smallestBurst = processArray[i].burstTime;
			}

		}


		return smallestIndex;
	}

	function findSmallestPriorityIndex() {
		var smallestIndex = 0;
		var smallestPriority = 0;

		//finds an initial burst time
		for (var i = 0; i < processArray.length; i++) {
			if (processArray[i].done == false && processArray[i].arrivalTime <= position) {
				smallestIndex = i;
				smallestPriority = processArray[i].priority;
				break;
			}
		}

		//looks through the array to find a smaller burst time
		for (var i = smallestIndex; i < processArray.length; i++) {
			if (processArray[i].priority < smallestPriority && processArray[i].done == false && processArray[i].arrivalTime <= position) {
				smallestIndex = i;
				smallestPriority = processArray[i].priority;
			}

		}


		return smallestIndex;
	}



	//checks if all the processes have completed
	function isDone() {
		var done = true;
		for (var i = 0; i < processArray.length; i++) {
			if (processArray[i].done == false) {
				done = false;
				//console.log("not done   i:"+i);
			}
		}

		return done;
	}


	//inserts idle time if no process is ready to go yet
	function fillGaps() {
		for (var i = 0; i < processArray.length; i++) {
			if (processArray[i].done == false) {
				if (processArray[i].arrivalTime > position) {
					bar.addItem("idle", processArray[i].arrivalTime - position);

				}
				break;
			}
		}
	}

	//used to display the gant chart
	function progressBar() {
		this.indexes = [];
		this.names = [];
		this.sum = 0;

		this.addItem = function (name, progressLength) {
			var previousName = this.names[this.names.length - 1];

			if (this.names.length > 0 && previousName == name) {
				this.indexes[this.indexes.length - 1] += progressLength;
				this.sum += progressLength;
				position += progressLength;
			}
			else {
				if (previousName != "idle" && previousName != "context switch" && name != "idle" && position != 0 && contexSwitch > 0
					|| name == "idle" && progressLength <= contexSwitch && position != 0) {
					this.indexes[this.indexes.length] = contexSwitch;
					this.names[this.names.length] = "context switch";
					this.sum += contexSwitch;
					position += contexSwitch;
					position = parseFloat(position.toPrecision(12));
				}
				if ((name == "idle" && progressLength <= contexSwitch && position != 0) == false) {
					this.indexes[this.indexes.length] = progressLength;
					this.names[this.names.length] = name;
					this.sum += progressLength;
					position += progressLength;
				}
			}
			position = parseFloat(position.toPrecision(12));
			this.sum = parseFloat(this.sum.toPrecision(12));

		}



		this.displayBar = function () {


			var pos = 0;

			for (var i = 0; i < this.indexes.length; i++) {
				// console.log("name:"+this.names[i]+"  index:"+this.indexes[i]);
				var length = (this.indexes[i] / this.sum) * 100;
				addToBar(this.names[i], length, pos, this.indexes[i], i);
				pos += this.indexes[i];
				pos = parseFloat(pos.toPrecision(12));
			}

			createRuler(this.sum);

			// console.log("sum:"+this.sum+"   "+runningTime);

			var utilization = 100 - (((this.sum - runningTime) / this.sum) * 100);
			utilization = Math.round(utilization * 100) / 100;

			sortNames();

			var waitTimes = [];

			waitTimes[0] = processArray[0].finishTime - processArray[0].arrivalTime - processArray[0].initialBurst;
			waitTimes[0] = parseFloat(waitTimes[0].toPrecision(12));
			var fullExplanation = '';

			fullExplanation += '<p class="lead"> CPU utilization: $ ' + utilization + '\\%   $' +
				'<br><br>Average Wait Time: <span style="font-size:24px">$ \\frac{' + waitTimes[0];

			var waitSum = waitTimes[0];

			for (var i = 1; i < processArray.length; i++) {
				waitTimes[i] = processArray[i].finishTime - processArray[i].arrivalTime - processArray[i].initialBurst;
				waitTimes[i] = parseFloat(waitTimes[i].toPrecision(12));

				fullExplanation += '+' + waitTimes[i];
				waitSum += waitTimes[i];
			}

			var averageWait = waitSum / processArray.length;
			averageWait = Math.round(averageWait * 10000) / 10000;

			fullExplanation += '}{' + processArray.length + '} $</span> $ = ' + averageWait + ' $';

			$("#explanation-equation").html(fullExplanation);

			mainOutput.waitingTime = waitTimes;
			mainOutput.avgWait = averageWait;
			mainOutput.utilization = utilization;

			// for(let i=0; i<processArray.length;i++){
			// 	mainOutput.o_pid.push(processArray[i].processName);
			// 	mainOutput.o_arrivaltime.push(processArray[i].arrivalTime);
			// 	mainOutput.o_bursttime.push(processArray[i].burstTime);
			// 	mainOutput.completionTime.push(processArray[i].finishTime);
			// 	mainOutput.turnAroundTime.push(processArray[i].finishTime-processArray[i].arrivalTime)
			// }
			// console.log(waitTimes);
			// console.log(processArray[0].finishTime)
			// console.log(processArray[0].finishTime-processArray[0].arrivalTime
			// console.log(mainOutput)
			//updates equation
			Preview.Update();
		}
	}

	function process(processName, burstTime, arrivalTime, pIndex, newPriority) {
		this.processName = processName;
		this.burstTime = burstTime;
		this.initialBurst = burstTime;
		this.arrivalTime = arrivalTime;
		this.done = false;
		this.hasStarted = false;
		this.finishTime;
		this.priority = newPriority;

		this.pIndex = pIndex;

		this.finished = function () {
			this.done = true;
			this.finishTime = position;

			// 	console.log(this.processName+" finished at position:"+position);
			// console.log("wait time:"+ (this.finishTime-this.arrivalTime- this.initialBurst));

			// mainOutput.o_pid.push(processName);
			// mainOutput.o_arrivaltime.push(arrivalTime);
			// mainOutput.o_bursttime.push(burstTime);
			// mainOutput.completionTime.push(position);
			// mainOutput.waitingTime.push((this.finishTime-this.arrivalTime- this.initialBurst));
			// mainOutput.turnAroundTime.push((this.finishTime-this.arrivalTime));
			// console.log(mainOutput);
		}
	}


	//sorts the processArray in terms of arrival times
	function sortArriveTimes() {

		function compareArrivals(process1, process2) {

			if (process1.arrivalTime > process2.arrivalTime) {
				return 1;
			}

			else if (process1.arrivalTime < process2.arrivalTime) {
				return -1;
			}

			else {
				return 0;
			}

		}

		processArray.sort(compareArrivals);
	}

	//sorts the processArray in terms of process names. i.e. P1,P2,P3, etc
	function sortNames() {

		function compareNames(process1, process2) {

			if (process1.pIndex > process2.pIndex) {
				return 1;
			}

			else if (process1.pIndex < process2.pIndex) {
				return -1;
			}

			else {
				return 0;
			}

		}

		processArray.sort(compareNames);
	}

	//loads the values into processArray from the table
	function loadValues() {
		processArray = [];

		runningTime = 0;

		var index = 0;
		for (var i = 0; i < processCount; i++) {

			var burstTime = Number($("#burst_" + (i + 1)).val()) + 0.0;
			runningTime += burstTime;
			var arrivalTime = Number($("#arrive_" + (i + 1)).val()) + 0.0;
			var processName = "P" + (i + 1);
			var priority = Number($("#priority_" + (i + 1)).val()) + 0.0;

			if (burstTime < 0) {
				alert("Please enter a valid Input...");
				location.reload();
			}
			else if (arrivalTime < 0) {
				alert("Please enter a valid Input...");
				location.reload();
			}
			else if (burstTime > 0 && isNaN(arrivalTime) == false) {
				processArray[index] = new process(processName, burstTime, arrivalTime, i, priority);
				index++;
			}


		}
	}

	function addToBar(processName, percent, start, duration, index) {
		//find the end time of the process
		var end = start + duration;
		end = parseFloat(end.toPrecision(12));

		if ($("#bar_" + index).length == 0) {
			$(".progress").append(" <div class='progress-bar' data-toggle='tooltip' title=' ' data-placement='right' id='bar_" + index + "' role='progressbar' >" + processName + "</div>");
		}
		else {
			$("#bar_" + index).removeClass("progress-bar-idle");
			$("#bar_" + index).removeClass("progress-bar-context");
			$("#bar_" + index).removeClass("progress-bar-first");
			$("#bar_" + index).removeClass("progress-bar-second");
			$("#bar_" + index).removeClass("progress-bar-third");
			$("#bar_" + index).removeClass("progress-bar-fourth");
			$("#bar_" + index).removeClass("progress-bar-fifth");
			$("#bar_" + index).removeClass("progress-bar-sixth");
			$("#bar_" + index).removeClass("progress-bar-seventh");
			$("#bar_" + index).removeClass("progress-bar-eighth");
			$("#bar_" + index).removeClass("progress-bar-ninth");
			$("#bar_" + index).removeClass("progress-bar-tenth");
		}



		if (processName == "P1") {
			$("#bar_" + index).addClass("progress-bar-first");

		}
		else if (processName == "P2") {
			$("#bar_" + index).addClass("progress-bar-second");
		}

		else if (processName == "P3") {
			$("#bar_" + index).addClass("progress-bar-third");
		}

		else if (processName == "P4") {
			$("#bar_" + index).addClass("progress-bar-fourth");
		}

		else if (processName == "P5") {
			$("#bar_" + index).addClass("progress-bar-fifth");
		}

		else if (processName == "P6") {
			$("#bar_" + index).addClass("progress-bar-sixth");
		}

		else if (processName == "P7") {
			$("#bar_" + index).addClass("progress-bar-seventh");
		}

		else if (processName == "P8") {
			$("#bar_" + index).addClass("progress-bar-eighth");
		}

		else if (processName == "P9") {
			$("#bar_" + index).addClass("progress-bar-ninth");
		}

		else if (processName == "P10") {
			$("#bar_" + index).addClass("progress-bar-tenth");
		}

		else if (processName == "context switch") {
			$("#bar_" + index).addClass("progress-bar-context");
		}
		else if (processName == "idle") {
			$("#bar_" + index).addClass("progress-bar-idle");
		}


		var newName = processName;

		var tooltip;

		var toolTipTitle = processName;

		if (processName == "idle") {
			toolTipTitle = "Idle CPU";
			newName = "";
		}

		else if (processName == "context switch") {
			toolTipTitle = "Context Switch";
			newName = "";
		}

		//sets the tooltip
		$("#bar_" + index).attr('title', toolTipTitle + "\nStart: " + start + "\nDuration: " + duration + "\nEnd: " + end);

		//sets the processName, should be blank for context switch or idle
		$("#bar_" + index).text(newName);

		//sets the width of the progress bar item
		$("#bar_" + index).css('width', percent + "%");
	}

	//First Come First Served function
	function FCFS() {
		sortArriveTimes();


		for (var i = 0; i < processArray.length; i++) {
			fillGaps();

			bar.addItem(processArray[i].processName, processArray[i].burstTime);

			processArray[i].finished();
		}




	}
	function SJF() {
		sortArriveTimes();

		while (isDone() == false) {

			fillGaps();

			var i = findSmallestBurstIndex();

			bar.addItem(processArray[i].processName, processArray[i].burstTime);

			processArray[i].finished();

		}

	}

	//Shortes Remaining Job First algorithm
	function SRJF() {


		function findNextJump(proccessIndex) {
			var interruptFound = false;

			for (var i = 0; i < processArray.length; i++) {
				if (processArray[i].done == false
					&& processArray[i].arrivalTime < position + processArray[proccessIndex].burstTime
					&& processArray[i].arrivalTime > processArray[proccessIndex].arrivalTime
					&& processArray[i].burstTime < processArray[proccessIndex].burstTime
					&& i != proccessIndex
					&& processArray[i].hasStarted == false) {
					// console.log("interupted by:"+processArray[i].processName);
					processArray[proccessIndex].burstTime -= processArray[i].arrivalTime - position;
					bar.addItem(processArray[proccessIndex].processName, processArray[i].arrivalTime - position);
					processArray[proccessIndex].hasStarted = true;
					interruptFound = true;
					break;
				}


			}

			if (interruptFound == false) {
				bar.addItem(processArray[proccessIndex].processName, processArray[proccessIndex].burstTime);
				processArray[proccessIndex].finished();
			}

		}

		sortArriveTimes();
		while (isDone() == false) {


			fillGaps();

			var i = findSmallestBurstIndex();

			// console.log("starting:"+processArray[i].processName);

			findNextJump(i);





		}

	}

	function priority() {

		function findNextJump(proccessIndex) {
			var interruptFound = false;

			for (var i = 0; i < processArray.length; i++) {
				if (processArray[i].done == false
					&& processArray[i].arrivalTime < position + processArray[proccessIndex].burstTime
					&& processArray[i].arrivalTime > processArray[proccessIndex].arrivalTime
					&& processArray[i].priority < processArray[proccessIndex].priority
					&& i != proccessIndex
					&& processArray[i].hasStarted == false) {
					// console.log("interupted by:"+processArray[i].processName);
					processArray[proccessIndex].burstTime -= processArray[i].arrivalTime - position;
					bar.addItem(processArray[proccessIndex].processName, processArray[i].arrivalTime - position);
					processArray[proccessIndex].hasStarted = true;
					interruptFound = true;
					break;
				}


			}

			if (interruptFound == false) {
				bar.addItem(processArray[proccessIndex].processName, processArray[proccessIndex].burstTime);
				processArray[proccessIndex].finished();
			}

		}

		sortArriveTimes();
		while (isDone() == false) {


			fillGaps();

			var i = findSmallestPriorityIndex();

			// console.log("starting:"+processArray[i].processName);

			findNextJump(i);





		}

	}
	
	function findHighestResponseRatioIndex() {
		var highestRatioIndex = -1;
		var highestResponseRatio = 0;
	
		for (var i = 0; i < processArray.length; i++) {
			if (processArray[i].done == false && processArray[i].arrivalTime <= position) {
				var waitingTime = position - processArray[i].arrivalTime;
				var responseRatio = (waitingTime + processArray[i].burstTime) / processArray[i].burstTime;
	
				if (responseRatio > highestResponseRatio) {
					highestResponseRatio = responseRatio;
					highestRatioIndex = i;
				}
			}
		}
	
		return highestRatioIndex;
	}
	
	function HRRN() {
		sortArriveTimes();  // Sort processes by arrival time.
	
		while (!isDone()) {
			fillGaps();  // Handle any idle times.
	
			var i = findHighestResponseRatioIndex();  // Find the process with the highest response ratio.
	
			if (i !== -1) {
				bar.addItem(processArray[i].processName, processArray[i].burstTime);
				processArray[i].finished();
			}
		}
	}


	// function multilevelFeedbackQueue() {
	// 	var queues = [];
	// 	var maxLevels = 3; // Define the number of queue levels
	// 	var initialQuantum = 1; // Initial time quantum for the highest priority queue
	
	// 	function initializeQueues() {
	// 		for (let i = 0; i < maxLevels; i++) {
	// 			queues.push({
	// 				processes: [],
	// 				quantum: initialQuantum * Math.pow(2, i), // Doubling quantum at each lower level
	// 			});
	// 		}
	// 	}
	
	// 	function executeQueues() {
	// 		var currentTime = 0;
	// 		var nextProcessIndex = 0;
	// 		processArray.forEach(proc => {
	// 			proc.started = false; // Ensure all processes are marked not started initially
	// 		});
	
	// 		while (!allQueuesEmpty() || nextProcessIndex < processArray.length) {
	// 			while (nextProcessIndex < processArray.length && processArray[nextProcessIndex].arrivalTime <= currentTime) {
	// 				if (!processArray[nextProcessIndex].started) {
	// 					queues[0].processes.push(processArray[nextProcessIndex]);
	// 					processArray[nextProcessIndex].started = true; // Mark as started
	// 				}
	// 				nextProcessIndex++;
	// 			}
	
	// 			let foundProcessToRun = false;
	// 			for (let i = 0; i < queues.length; i++) {
	// 				if (queues[i].processes.length > 0) {
	// 					let proc = queues[i].processes.shift();
	// 					let timeSlice = Math.min(proc.burstTime, queues[i].quantum);
	// 					bar.addItem(proc.processName, timeSlice);
	// 					proc.burstTime -= timeSlice;
	// 					currentTime += timeSlice;
	
	// 					if (proc.burstTime > 0) {
	// 						let nextQueueIndex = Math.min(i + 1, maxLevels - 1);
	// 						queues[nextQueueIndex].processes.push(proc);
	// 					} else {
	// 						proc.done = true;
	// 						proc.finishTime = currentTime;
	// 						updateOutput(proc);
	// 					}
	// 					foundProcessToRun = true;
	// 					break;
	// 				}
	// 			}
	
	// 			if (!foundProcessToRun) {
	// 				currentTime = nextIdleTime(currentTime);
	// 			}
	// 		}
	// 	}
	
	// 	function allQueuesEmpty() {
	// 		return queues.every(queue => queue.processes.length === 0);
	// 	}
	
	// 	function nextIdleTime(currentTime) {
	// 		let minArrivalTime = Infinity;
	// 		processArray.forEach(proc => {
	// 			if (!proc.done && !proc.started && proc.arrivalTime > currentTime) {
	// 				minArrivalTime = Math.min(minArrivalTime, proc.arrivalTime);
	// 			}
	// 		});
	// 		return minArrivalTime !== Infinity ? minArrivalTime : currentTime;
	// 	}
	
	// 	function updateOutput(proc) {
	// 		mainOutput.o_pid.push(proc.processName);
	// 		mainOutput.o_arrivaltime.push(proc.arrivalTime);
	// 		mainOutput.o_bursttime.push(proc.burstTime);
	// 		mainOutput.completionTime.push(proc.finishTime);
	// 		let turnAroundTime = proc.finishTime - proc.arrivalTime;
	// 		mainOutput.turnAroundTime.push(turnAroundTime);
	// 		let waitingTime = turnAroundTime - proc.burstTime;
	// 		mainOutput.waitingTime.push(waitingTime);
	// 	}
	
	// 	initializeQueues();
	// 	executeQueues();
	// }
	


// Pre-emptive Multilevel Feedback Queue
	// function multilevelFeedbackQueue() {
	// 	var queues = [];
	// 	var maxLevels = 3; // Define the number of queue levels
	// 	var initialQuantum = 1; // Initial time quantum for the highest priority queue
	
	// 	function initializeQueues() {
	// 		for (let i = 0; i < maxLevels; i++) {
	// 			queues.push({
	// 				processes: [],
	// 				quantum: initialQuantum * Math.pow(2, i) // Doubling quantum at each lower level
	// 			});
	// 		}
	// 	}
	
	// 	function executeQueues() {
	// 		var currentTime = 0;
	// 		var nextProcessIndex = 0;
	// 		processArray.forEach(proc => {
	// 			proc.started = false;
	// 			proc.done = false;
	// 		});
	
	// 		while (!allQueuesEmpty() || nextProcessIndex < processArray.length) {
	// 			// Check and enqueue any new arrivals
	// 			while (nextProcessIndex < processArray.length && processArray[nextProcessIndex].arrivalTime <= currentTime) {
	// 				let proc = processArray[nextProcessIndex];
	// 				queues[0].processes.push(proc); // New arrivals always start in the highest priority queue
	// 				proc.started = true;
	// 				nextProcessIndex++;
	// 			}
	
	// 			// Find the highest priority non-empty queue
	// 			let foundProcess = false;
	// 			for (let i = 0; i < queues.length && !foundProcess; i++) {
	// 				if (queues[i].processes.length > 0) {
	// 					let proc = queues[i].processes.shift();
	// 					let timeSlice = Math.min(proc.burstTime, queues[i].quantum);
	// 					let nextArrivalTime = nextProcessIndex < processArray.length ? processArray[nextProcessIndex].arrivalTime : Infinity;
	// 					let executionTime = Math.min(timeSlice, nextArrivalTime - currentTime); // Adjust time slice if new process arrives mid-execution
	
	// 					bar.addItem(proc.processName, executionTime, currentTime);
	// 					proc.burstTime -= executionTime;
	// 					currentTime += executionTime;
	
	// 					// If the process has remaining time and was not interrupted by a new arrival
	// 					if (proc.burstTime > 0 && currentTime < nextArrivalTime) {
	// 						let nextQueueLevel = Math.min(i + 1, maxLevels - 1);
	// 						queues[nextQueueLevel].processes.push(proc);
	// 					} else if (proc.burstTime > 0) {
	// 						// Reinsert the process at the front of the same queue if it was preempted by an arrival
	// 						queues[i].processes.unshift(proc);
	// 					} else {
	// 						proc.done = true; // Mark the process as completed
	// 						updateOutput(proc, currentTime);
	// 					}
	
	// 					foundProcess = true;
	// 				}
	// 			}
	
	// 			if (!foundProcess) { // If no process was executed, advance time to the next process arrival
	// 				currentTime = nextArrivalTime;
	// 			}
	// 		}
	// 	}
	
	// 	function allQueuesEmpty() {
	// 		return queues.every(queue => queue.processes.length === 0);
	// 	}
	
	// 	function updateOutput(proc, finishTime) {
	// 		proc.finishTime = finishTime;
	// 		// Additional output handling code here
	// 	}
	
	// 	initializeQueues();
	// 	executeQueues();
	// }


	
	// function multilevelFeedbackQueue() {
	// 	var queues = [];
	// 	var maxLevels = 3; // Define the number of queue levels
	// 	var initialQuantum = 1; // Initial time quantum for the highest priority queue
	
	// 	function initializeQueues() {
	// 		for (let i = 0; i < maxLevels; i++) {
	// 			queues.push({
	// 				processes: [],
	// 				quantum: initialQuantum * Math.pow(2, i) // Doubling quantum at each lower level
	// 			});
	// 		}
	// 	}
	
	// 	function executeQueues() {
	// 		var currentTime = 0;
	// 		var nextProcessIndex = 0;
	// 		processArray.forEach(proc => {
	// 			proc.started = false;
	// 			proc.done = false;
	// 		});
	
	// 		while (!allProcessesComplete()) {
	// 			// Enqueue any new arrivals
	// 			while (nextProcessIndex < processArray.length && processArray[nextProcessIndex].arrivalTime <= currentTime) {
	// 				let proc = processArray[nextProcessIndex];
	// 				queues[0].processes.push(proc); // Start new arrivals in the highest priority queue
	// 				proc.started = true;
	// 				nextProcessIndex++;
	// 			}
	
	// 			let executed = false;
	// 			for (let i = 0; i < queues.length && !executed; i++) {
	// 				if (queues[i].processes.length > 0) {
	// 					let proc = queues[i].processes.shift();
	// 					let timeSlice = Math.min(proc.burstTime, queues[i].quantum);
	// 					let nextArrivalTime = nextProcessIndex < processArray.length ? processArray[nextProcessIndex].arrivalTime : Infinity;
						
	// 					bar.addItem(proc.processName, timeSlice, currentTime); // Simulate process execution
	// 					proc.burstTime -= timeSlice;
	// 					currentTime += timeSlice;

	// 					var lengthOfQueue1 = queues[0].processes.length;
	// 					var lengthOfQueue2 = queues[1].processes.length;
	// 					var lengthOfQueue3 = queues[2].processes.length;
	// 					var sums = lengthOfQueue1 + lengthOfQueue2 + lengthOfQueue3;
	
	// 					if (proc.burstTime > 0 && currentTime < nextArrivalTime && sums == 0) {


	// 						console.log(proc.processName,"Sum:", sums);
	// 						// Determine the next queue level, making sure it exists
	// 						queues[i].processes.push(proc);
							
	// 					} 
	// 					else if (proc.burstTime > 0) {
	// 						 // Reinsert the process at the end of the same queue
	// 						let nextQueueLevel = i + 1 < queues.length ? i + 1 : i;
	// 						queues[nextQueueLevel].processes.push(proc);
	// 					}
						
	// 					else {
	// 						proc.done = true; // Mark the process as completed
	// 						updateOutput(proc, currentTime);
	// 					}
	
	// 					executed = true;
	// 				}
	// 			}
	
	// 			if (!executed) {
	// 				// If no process was executed and there are more arrivals, advance to the next arrival time
	// 				currentTime = nextProcessIndex < processArray.length ? processArray[nextProcessIndex].arrivalTime : currentTime;
	// 			}
	// 		}
	// 	}
	
	// 	function allProcessesComplete() {
	// 		return processArray.every(proc => proc.done);
	// 	}
	
	// 	function barAddItem(processName, timeSlice, currentTime) {
	// 		// This would implement actual visual or logging logic for the bar
	// 		console.log(`${processName} runs from ${currentTime} to ${currentTime + timeSlice}`);
	// 	}
	
	// function updateOutput(proc) {
	// 	mainOutput.o_pid.push(proc.processName);
	// 	mainOutput.o_arrivaltime.push(proc.arrivalTime);
	// 	mainOutput.o_bursttime.push(proc.burstTime);
	// 	mainOutput.completionTime.push(proc.finishTime);
	// 	let turnAroundTime = proc.finishTime - proc.arrivalTime;
	// 	mainOutput.turnAroundTime.push(turnAroundTime);
	// 	let waitingTime = turnAroundTime - proc.burstTime;
	// 	mainOutput.waitingTime.push(waitingTime);
	// }
	
	// 	initializeQueues();
	// 	executeQueues();
	// }
	

	function multilevelFeedbackQueue() {
		var queues = [];
		var maxLevels = 3; // Define the number of queue levels
		var initialQuantum = 1; // Initial time quantum for the highest priority queue
	
		function initializeQueues() {
			for (let i = 0; i < maxLevels; i++) {
				queues.push({
					processes: [],
					quantum: initialQuantum * Math.pow(2, i) // Doubling quantum at each lower level
				});
			}
		}
	
		function executeQueues() {
			var currentTime = 0;
			var nextProcessIndex = 0;
			processArray.forEach(proc => {
				proc.started = false;
				proc.done = false;
				proc.initialBurstTime = proc.burstTime;
			});
	
			while (!allProcessesComplete()) {
				// Enqueue any new arrivals
				while (nextProcessIndex < processArray.length && processArray[nextProcessIndex].arrivalTime <= currentTime) {
					let proc = processArray[nextProcessIndex];
					queues[0].processes.push(proc); // Start new arrivals in the highest priority queue
					proc.started = true;
					nextProcessIndex++;
				}
	
				let executed = false;
				for (let i = 0; i < queues.length && !executed; i++) {
					if (queues[i].processes.length > 0) {
						let proc = queues[i].processes.shift();
						let timeSlice = Math.min(proc.burstTime, queues[i].quantum);
						let nextArrivalTime = nextProcessIndex < processArray.length ? processArray[nextProcessIndex].arrivalTime : Infinity;
						
						bar.addItem(proc.processName, timeSlice, currentTime); // Simulate process execution
						proc.burstTime -= timeSlice;
						currentTime += timeSlice;
	
						var lengthOfQueue1 = queues[0].processes.length;
						var lengthOfQueue2 = queues[1].processes.length;
						var lengthOfQueue3 = queues[2].processes.length;
						var sums = lengthOfQueue1 + lengthOfQueue2 + lengthOfQueue3;
	
						if (proc.burstTime > 0 && currentTime < nextArrivalTime && sums == 0) {


							console.log(proc.processName,"Sum:", sums);
							// Determine the next queue level, making sure it exists
							queues[i].processes.push(proc);
							
						} 
						else if (proc.burstTime > 0) {
							 // Reinsert the process at the end of the same queue
							let nextQueueLevel = i + 1 < queues.length ? i + 1 : i;
							queues[nextQueueLevel].processes.push(proc);
						}
						
						else {
							proc.done = true; // Mark the process as completed
							updateOutput(proc, currentTime);
						}
	
						executed = true;
					}
				}
	
				if (!executed) {
					// If no process was executed, advance to the next process arrival
					currentTime = nextProcessIndex < processArray.length ? processArray[nextProcessIndex].arrivalTime : currentTime;
				}
			}
		}
	
		function allProcessesComplete() {
			return processArray.every(proc => proc.done);
		}
	
		function updateOutput(proc, finishTime) {
			proc.burstTime = proc.initialBurstTime;
			proc.finishTime = finishTime;
			proc.turnAroundTime = proc.finishTime - proc.arrivalTime;
			proc.waitingTime = proc.turnAroundTime - proc.initialBurstTime;
			
	
			console.log(`Process ${proc.processName} completed at time ${finishTime}`);
			console.log(`Turnaround time for ${proc.processName}: ${proc.turnAroundTime}`);
			console.log(`Waiting time for ${proc.processName}: ${proc.waitingTime}`);
		}
	
		initializeQueues();
		executeQueues();
	}
	
	function barAddItem(processName, timeSlice, currentTime) {
		console.log(`${processName} runs from ${currentTime} to ${currentTime + timeSlice}`);
	}
	
	

	function roundRobin() {
		function findNextJump(index) {
			while (true) {

				if (processArray[index].burstTime <= timeQuantum
					&& processArray[index].done == false
					&& processArray[index].arrivalTime <= position) {
					bar.addItem(processArray[index].processName, processArray[index].burstTime);
					processArray[index].finished();

					// console.log("finished:"+processArray[index].processName + "  postion:"+position);
					index = (index + 1) % processArray.length
					return index;
					break;
				}

				if (processArray[index].done == false
					&& processArray[index].arrivalTime <= position
					&& processArray[index].burstTime > timeQuantum) {
					// console.log("switched to:"+processArray[index].processName);
					processArray[index].burstTime -= timeQuantum;
					bar.addItem(processArray[index].processName, timeQuantum);
				}
				index = (index + 1) % processArray.length
			}
		}

		var i = 0;

		sortArriveTimes();
		while (isDone() == false) {
			fillGaps();
			i = findNextJump(i);
		}
	}



	function roundRobin() {
		let currentTime = 0; // Current time in the simulation
		let processQueue = []; // Queue to manage the round-robin execution
	
		// Initialize processes with 'started' flag and 'done' flags
		processArray.forEach(process => {
			process.started = false;
			process.done = false;
			process.remainingBurst = process.burstTime;
		});
	
		// Function to enqueue processes that have arrived
		function enqueueArrivedProcesses() {
			processArray.forEach(process => {
				if (!process.started && process.arrivalTime <= currentTime) {
					processQueue.push(process);
					process.started = true;
				}
			});
		}
	
		// Main execution loop
		while (!isDone()) {
			enqueueArrivedProcesses();
	
			if (processQueue.length > 0) {
				let process = processQueue.shift(); // Dequeue the next process
				let timeSlice = Math.min(process.remainingBurst, timeQuantum);
				bar.addItem(process.processName, timeSlice);
				process.remainingBurst -= timeSlice;
				currentTime += timeSlice;
	
				if (process.remainingBurst > 0) {
					enqueueArrivedProcesses(); // Re-check for new arrivals before potentially re-queuing
					processQueue.push(process); // Re-queue the process if not done
				} else {
					process.done = true;
					process.finishTime = currentTime; // Capture the finish time
					updateOutput(process);
				}
			} else {
				// If no process is ready and not all are done, move time forward to the next process arrival
				let nextArrival = findNextArrivalTime(currentTime);
				if (nextArrival > currentTime) {
					bar.addItem("idle", nextArrival - currentTime);
					currentTime = nextArrival; // Advance time
				}
			}
		}
	}
	
	// Find the next time when a new process arrives
	function findNextArrivalTime(currentTime) {
		let nextArrival = Infinity;
		processArray.forEach(process => {
			if (!process.started && process.arrivalTime > currentTime) {
				nextArrival = Math.min(nextArrival, process.arrivalTime);
			}
		});
		return nextArrival;
	}
	
	// Check if all processes are completed
	function isDone() {
		return processArray.every(process => process.done);
	}
	
	// Update output for the process
	function updateOutput(process) {
		mainOutput.o_pid.push(process.processName);
		mainOutput.o_arrivaltime.push(process.arrivalTime);
		mainOutput.o_bursttime.push(process.burstTime);
		mainOutput.completionTime.push(process.finishTime);
		let tat = process.finishTime - process.arrivalTime;
		mainOutput.turnAroundTime.push(tat);
		let waitTime = tat - process.burstTime;
		mainOutput.waitingTime.push(waitTime);
	}
	
	
	

	function run() {
		loadValues();

		

		Selectedalgorithm = algorithm;

		if (processArray.length > 0) {

			sortArriveTimes();
			position = 0;


			bar = new progressBar();

			if (algorithm == "FCFS") {
				$("#algorithm_explanation").text("First Come First Served will execute proccesses in the order in which they arrived");
				FCFS();
				processTotal = processArray;
			}

			else if (algorithm == "SJF") {
				$("#algorithm_explanation").text("Shortest Job First will execute proccesses from smallest to biggest");
				SJF();
				processTotal = processArray;
			}

			else if (algorithm == "SRJF") {
				SRJF();
				$("#algorithm_explanation").text("Shortest Remaining Job First will execute proccesses from smallest to biggest. If a new proccess arrives that is smaller than the currently running proccess, it will interrupt it.");
				processTotal = processArray;
			}

			else if (algorithm == "Round Robin") {
				$("#algorithm_explanation").text("Round Robin will execute each proccess for the duration of the time quantum. It will then move on to the next proccess. ");
				roundRobin();
				processTotal = processArray;
				tq = timeQuantum;
			}

			else if (algorithm == "HRRN") {
				$("#algorithm_explanation").text("HRRN is a non-preemptive algorithm in which, the scheduling is done on the basis of Response Ratio");
				console.log("HRRN");
				HRRN();
				processTotal = processArray;
			}

			else if (algorithm == "MLQ") {
				$("#algorithm_explanation").text("MLFQ optimizes resource utilization by dynamically adjusting priorities and utilizing multiple queues");

				console.log("MLQ");
				multilevelFeedbackQueue();
				processTotal = processArray;
				console.log("ALgo executed")
			}

			if (algorithm == "Priority") {
				$(".priority").collapse("show");
				$("#algorithm_explanation").text("Priority Scheduling will execute each process according to the assigned priority. In this case a lower priority number is better.");
				priority();
				processTotal = processArray;
			}

			bar.displayBar();
		}


	}


	//creates the tick marks under the gant chart
	function createRuler(itemAmount) {

		var multi = 1;
		var word = " " + itemAmount;

		if (itemAmount > 5000) {
			// console.log("length:"+word.length)
			var power = Math.pow(10, word.length - 2);
			itemAmount = itemAmount / power;
			multi = power;
		}


		else if (itemAmount > 2500) {
			itemAmount = itemAmount / 100;
			multi = 100;
		}

		else if (itemAmount > 1000) {
			itemAmount = itemAmount / 50;
			multi = 50;
		}

		else if (itemAmount > 500) {
			itemAmount = itemAmount / 25;
			multi = 25;
		}


		else if (itemAmount > 100) {
			itemAmount = itemAmount / 10;
			multi = 10;
		}

		else if (itemAmount > 50) {
			itemAmount = itemAmount / 5;
			multi = 5;
		}


		for (var j = 0; j < itemAmount; j++) {
			var ruler = $("#rule2").empty();
			var len = Number(itemAmount) || 0;


			var item = $(document.createElement("li"));
			$(item).addClass("zero");
			ruler.append(item.text(0));

			for (var i = 0; i < len; i++) {
				var item = $(document.createElement("li"));
				ruler.append(item.text(((i + 1) * multi)));
			}


		}


		var width = $(".progress").width();

		var spacing = (width / itemAmount) + "px";
		$(".ruler").css("padding-right", spacing).find("li").css("padding-left", spacing);
		$(".zero").css("padding-left", 0);
		$(".zero").css("padding-right", "0.5px");

	}


	$('#add_row').click(function () {
		processCount++;
		$("#row_" + processCount).collapse("show");

		$('#remove_row').prop("disabled", false);
		if (processCount == 10) {
			$('#add_row').prop("disabled", true);
		}

		run();
		$('#proccess_num').val(processCount);
	});

	//removing a row
	$('#remove_row').click(function () {

		$("#row_" + processCount).collapse("hide");
		processCount--;

		$('#add_row').prop("disabled", false);
		if (processCount == 1) {
			$('#remove_row').prop("disabled", true);
		}
		run();
		$('#proccess_num').val(processCount);
	});


	$('#subtract_context').click(function () {

		if (contexSwitch >= 0.1) {
			contexSwitch -= 0.1;
			contexSwitch = parseFloat(contexSwitch.toPrecision(12));
		}


		run();
		$('#enter_context').val(contexSwitch);
	});


	$('#add_context').click(function () {


		contexSwitch += 0.1;
		contexSwitch = parseFloat(contexSwitch.toPrecision(12));
		run();
		$('#enter_context').val(contexSwitch);

	});

	$('#subtract_quantum').click(function () {

		if (timeQuantum > 0.5) {
			timeQuantum -= 0.5;
			timeQuantum = parseFloat(timeQuantum.toPrecision(12));
		}

		run();
		$('#enter_quantum').val(timeQuantum);
	});


	$('#add_quantum').click(function () {

		timeQuantum += 0.5;
		timeQuantum = parseFloat(timeQuantum.toPrecision(12));

		run();
		$('#enter_quantum').val(timeQuantum);

	});


	// when you enter a quantum time, used for Round Robin
	$('#enter_quantum').on('input propertychange paste', function () {

		if (isNaN($(this).val()) == false && $(this).val() != 0) {
			timeQuantum = Number($(this).val());
		}

		run();
	});

	//when you set a context switch time
	$('#enter_context').on('input propertychange paste', function () {

		if (isNaN($(this).val()) == false) {
			contexSwitch = Number($(this).val());
		}
		run();
	});

	//when you input a value into the table
	$('td input').on('input propertychange paste', function () {
		run();

	});



	//when you click on the algorithm dropdown
	$(".algorithm_dropdown li a").click(function () {
		$("#algorithm_button").html($(this).attr("calcStyle") + ' <span class="caret">');
		algorithm = $(this).attr("calcStyle");

		if (algorithm == "Round Robin") {
			$("#solver_group").removeClass("hidden");
		}
		else {
			$("#solver_group").addClass("hidden");
		}

		if (algorithm != "Priority") {
			$(".priority").collapse("hide");
		}

		run();

	})



	$(window).resize(function () {
		createRuler(bar.sum);
	});

	// console.log(mainOutput.o_pid.splice(0,Math.ceil(mainOutput.o_pid.length/2)));

});


var chartdiv = document.getElementById('chartdiv');
chartdiv.style.display = "none";

$(".runButton").click(function () {

	//Run button property change
	var runbtn = document.getElementById('runBtn');
	runbtn.disabled = true;
	runbtn.style.background = 'grey';
	runbtn.style.cursor = 'not-allowed';


	let tat = 0;
	let totalProcess = processTotal.length;
	// mainOutput.algorithm = processTotal.algorithm;
	// console.log(Selectedalgorithm);
	
	mainOutput.quantum = tq;

	for (let i = 0; i < totalProcess; i++) {
		mainOutput.o_pid[i] = processTotal[i].processName;
		mainOutput.o_arrivaltime[i] = processTotal[i].arrivalTime;
		mainOutput.o_bursttime[i] = processTotal[i].burstTime;
		mainOutput.completionTime[i] = processTotal[i].finishTime;
		mainOutput.o_priority[i] = processTotal[i].priority;
		mainOutput.turnAroundTime[i] = (processTotal[i].finishTime - processTotal[i].arrivalTime);
		tat = tat + mainOutput.turnAroundTime[i];
	}

	mainOutput.avgtat = parseFloat((tat / totalProcess).toFixed(2));

	//changing the display property from "none" to "flex" of chart section.
	chartdiv.style.display = "flex";

	//creating a dynamic table and displaying it on front-end
	var final_table = document.getElementById('outputTable');

	for (let j = 0; j < totalProcess; j++) {

		var row = final_table.insertRow(-1);
		var cell2 = row.insertCell(0);
		var cell1 = row.insertCell(1);
		var cell3 = row.insertCell(2);
		var cell4 = row.insertCell(3);
		var cell5 = row.insertCell(4);
		var cell6 = row.insertCell(5);

		cell1.innerHTML = mainOutput.o_arrivaltime[j];
		cell2.innerHTML = mainOutput.o_pid[j];
		cell3.innerHTML = mainOutput.o_bursttime[j];
		cell4.innerHTML = mainOutput.completionTime[j];
		cell5.innerHTML = mainOutput.turnAroundTime[j];
		cell6.innerHTML = mainOutput.waitingTime[j];
	}


	let cpuUtilization = document.getElementById("utilization");
	cpuUtilization.innerHTML = `${mainOutput.utilization}%`;

	let avgwt = document.getElementById("avgwt");
	avgwt.innerHTML = mainOutput.avgWait;

	let avgtat = document.getElementById("avgtat");
	avgtat.innerHTML = mainOutput.avgtat;


});