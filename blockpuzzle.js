/*
 * Copyright 2015 Martin Robinson
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var BlockPuzzle = {
    AVAILABLE_HOURS: 40,

    // When reservations don't have any hours specified, free time
    // can optionally steal some of those hours. These hours, as
    // with other reservations with no hours specified will not be
    // allocated if the available hours are totally consumed.
    FREE_TIME_ALLOCATION: 5,

    TRACK_HEIGHT: 40,
    TRACK_BORDER_WIDTH: 1,
    TRACK_GAP: 5,

    // The gap between labels and the thing that they point to.
    LABEL_GAP: 5,

    // The font size for the labels.
    LABEL_FONT_SIZE: 10,

    // The font family for the labels.
    LABEL_FONT_FAMILY: "sans-serif",

    // The space on the left hand side of the chart used to print the track name.
    TRACK_LEFT_LABEL_WIDTH: 100,

    // The space on the left hand side of the chart used to print the track name.
    CANVAS_TOP_LABEL_HEIGHT: 40,

    RESERVATION_PADDING: 1,

    COLOR_SCHEME: {
        label: "black",
        track_border: "rgb(256, 0, 0)",
        month_line: "rgba(100, 100, 100, 0.5)",
        day_line: "rgba(200, 200, 200, 0.4)",
        reservations: [
            "#4D4D4D",
            "#5DA5DA",
            "#FAA43A",
            "#60BD68",
            "#B2912F",
            "#B276B2",
            "#DECF3F",
            "#F15854",
        ],
    },

    Line: function() {
        this.getElement = function() {
            return this.element;
        };

        this.setPoints = function(point1, point2) {
            this.element.setAttribute("x1", point1[0]);
            this.element.setAttribute("y1", point1[1]);
            this.element.setAttribute("x2", point2[0]);
            this.element.setAttribute("y2", point2[1]);
        };

        this.setStroke = function(width, color) {
            this.element.setAttribute("stroke", color);
            this.element.setAttribute("stroke-width", width);
        };

        this.setVisible = function(visible) {
            if (visible) {
                this.element.setAttribute("visibility", "visible");
            } else {
                this.element.setAttribute("visibility", "hidden");
            }
        };

        this.element = document.createElementNS("http://www.w3.org/2000/svg", "line");
    },

    Rect: function() {
        this.getElement = function() {
            return this.element;
        };

        this.setOrigin = function(origin) {
            this.origin = origin;
            this.element.setAttribute("x", origin[0]);
            this.element.setAttribute("y", origin[1]);
        };

        this.setSize = function(size) {
            this.size = size;
            this.element.setAttribute("width", size[0]);
            this.element.setAttribute("height", size[1]);
        };

        this.topRight = function(size) {
            return [this.origin[0] + this.size[0], this.origin[1]];
        };

        this.bottomRight = function(size) {
            return [this.origin[0] + this.size[0], this.origin[1] + this.size[1]];
        };

        this.bottomLeft = function(size) {
            return [this.origin[0], this.origin[1] + this.size[1]];
        };

        this.setFill = function(fill) {
            this.element.style.fill = fill;
        };

        this.setStroke = function(width, color) {
            this.element.setAttribute("stroke", color);
            this.element.setAttribute("stroke-width", width);
        };

        this.element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.origin = [0, 0];
        this.size = [0, 0];
    },

    Day: function(date, lastDayOfMonth) {
        this.buildDOM = function(container) {
            if (this.line === null) {
                this.line = new BlockPuzzle.Line();
                if (this.lastDayOfMonth)
                    this.line.setStroke(2, BlockPuzzle.COLOR_SCHEME.month_line);
                else
                    this.line.setStroke(1, BlockPuzzle.COLOR_SCHEME.day_line);
            }

            container.appendChild(this.line.getElement());
        };

        this.positionAndSizeElements = function(canvas, dayIndex) {
            var x = canvas.getDateOffsetXCoordinate(dayIndex);
            this.line.setVisible(this.lastDayOfMonth || canvas.dayWidth > 2);
            this.line.setPoints([x, 0], [x, canvas.height]);
        };

        this.containsDate = function(date) {
            return date.getFullYear() == this.date.getFullYear() &&
                   date.getMonth() == this.date.getMonth() &&
                   date.getDate() == this.date.getDate();
        };

        this.line = null;
        this.date = date;
        this.lastDayOfMonth = lastDayOfMonth;
    },

    Reservation: function(name, start, end, hours) {
        this.buildDOM = function(container) {
            if (this.path === null)
                this.path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            container.appendChild(this.path);
        };

        this.positionAndSizeElements = function(canvas) {
            var pathString = "M " + this.topPoints[0].join(" ") + " ";
            for (var j = 1; j < this.topPoints.length; j++) {
                pathString += "L " + this.topPoints[j].join(" ") + " ";
            }

            for (j = this.bottomPoints.length - 1; j >= 0; j--) {
                pathString += "L " + this.bottomPoints[j].join(" ") + " ";
            }
            pathString += "L" + this.topPoints[0].join(" ");

            this.path.setAttribute("d", pathString);
            this.path.setAttribute("fill", BlockPuzzle.Reservation.getColorForReservation(this));

            this.topPoints = [];
            this.bottomPoints = [];
        };

        this.addPoints = function(topPoint, bottomPoint, dayWidth) {
            this.topPoints.push(topPoint);
            this.bottomPoints.push(bottomPoint);

            var numberOfPoints = this.topPoints.length;
            if (numberOfPoints == 1)
                return;

            var leftTop = this.topPoints[numberOfPoints - 2];
            var leftBottom = this.bottomPoints[numberOfPoints - 2];
            var leftHeight = leftBottom[1] - leftTop[1];
            var rightHeight = bottomPoint[1] - topPoint[1];
            if (leftHeight == rightHeight)
                return;

            var littleAdjust = dayWidth / 2;
            var bigAdjust = littleAdjust;

            // If both sides of this junction have height, angle the large side away
            // to insert some visual distance between adjacent reservations.
            if (leftHeight !== 0 && rightHeight !== 0) {
                bigAdjust += 1;
            }

            var rightPoint = leftHeight > rightHeight ?
                leftTop[0] - littleAdjust : topPoint[0] + bigAdjust;
            var leftPoint = leftHeight > rightHeight ?
                leftTop[0] - bigAdjust : topPoint[0] + littleAdjust;

            leftTop[0] = leftBottom[0] = leftPoint;
            topPoint[0] = bottomPoint[0] = rightPoint;
        };

        this.setMouseOverHandler = function(handler) {
            this.path.onmousemove = handler.bind(this, this);
        };

        this.name = name;

        // Normalize dates to all be at midnight.
        this.start = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
        this.end = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0);
        this.topPoints = [];
        this.bottomPoints = [];
        this.path = null;
        this.freeTime = false;

        if (hours !== undefined && hours !== null)
            this.hours = hours;
        else
            this.hours = null;
    },

    Slice: function(start, end) {
        this.totalHoursReserved = function() {
            var total = this.freeTimeHours;
            for (var i = 0; i < this.reservationHours.length; i++)
                total += this.reservationHours[i];
            return total;
        };

        this.addPointsToReservations = function(dayWidth) {
            var numReservations = this.reservations.length;
            if (this.freeTimeHours > 0)
                numReservations++;

            var totalHoursReserved = this.totalHoursReserved();
            var totalPadding = (2 * BlockPuzzle.TRACK_BORDER_WIDTH) +
                                numReservations * 2 * BlockPuzzle.RESERVATION_PADDING;
            var reservationHeightPerHour = (this.size[1] - totalPadding) / totalHoursReserved;
            var totalDrawnHeight = (totalHoursReserved * reservationHeightPerHour) + totalPadding;
            var offset = ((this.size[1] - totalDrawnHeight) / 2) + BlockPuzzle.TRACK_BORDER_WIDTH;

            var origin = this.origin;
            var size = this.size;
            function setReservationPoints(reservation, offset, height) {
                reservation.addPoints([origin[0], offset], [origin[0], offset + height], dayWidth);
                reservation.addPoints([origin[0] + size[0], offset],
                                      [origin[0] + size[0], offset + height], dayWidth);
            }

            offset += BlockPuzzle.RESERVATION_PADDING;
            for (var i = 0; i < this.reservations.length; i++) {
                var reservationHeight = reservationHeightPerHour * this.reservationHours[i];
                setReservationPoints(this.reservations[i], offset, reservationHeight);
                offset += reservationHeight + (BlockPuzzle.RESERVATION_PADDING * 2);
            }

            if (this.freeTime !== null) {
                // Undoing the last offset prevents a dip into the bottom of the track area.
                // When there are free time hours this dip normally connects to the block of
                // free time, but when there are 0 hours, the block isn't shown.
                if (this.freeTimeHours === 0)
                    offset -= (BlockPuzzle.RESERVATION_PADDING * 2);
                setReservationPoints(this.freeTime, offset,
                                     this.freeTimeHours * reservationHeightPerHour);
            }
        };

        this.calculateHoursForReservations = function() {
            this.reservationHours = [];
            var hoursLeft = BlockPuzzle.AVAILABLE_HOURS;
            var numReservationsWithoutHours = 0;
            for (var i = 0; i < this.reservations.length; i++) {
                var reservation = this.reservations[i];
                if (null !== reservation.hours) {
                    hoursLeft -= reservation.hours;
                    this.reservationHours.push(reservation.hours);
                } else {
                    this.reservationHours.push(null);
                    numReservationsWithoutHours++;
                }
            }

            if (hoursLeft > 0 && this.freeTime !== null) {
                this.freeTimeHours += this.freeTime.hours;
                hoursLeft -= this.freeTime.hours;
            }

            if (numReservationsWithoutHours > 0) {
                var hoursPerRemainingReservation = hoursLeft <= 0 ?
                     0 : (hoursLeft / numReservationsWithoutHours);
                for (var j = 0; j < this.reservations.length; j++) {
                    if (null === this.reservationHours[j])
                        this.reservationHours[j] = hoursPerRemainingReservation;
                }
            } else if (this.freeTime !== null) {
                // If we don't need to divvy out hours to reservations, just allocate
                // the rest to free time.
                this.freeTimeHours += hoursLeft;
            }
        };

        this.containsReservation = function(reservation) {
            return reservation.end >= this.start && reservation.start < this.end;
        };

        this.start = start;
        this.end = end;
        this.reservations = [];
        this.size = null;
        this.origin = null;
        this.reservationHours = [];

        // Optionally track free time.
        this.freeTimeHours = 0;
        this.freeTime = null;
    },

    Track: function(name, start, end) {
        this.buildSlices = function(container) {
            var dates = [];
            function addStartAndEndToDates(start, end) {
                dates.push(start);

                // The end date is the day before the next slice begins, so normalize
                // to the beginning of every new slice. For slice ending dates, we remove
                // this day below, but these end dates also specify the start of new slices.
                end = new Date(end);
                end.setDate(end.getDate() + 1);
                dates.push(end);
            }

            addStartAndEndToDates(this.start, this.end);
            for (var i = 0; i < this.reservations.length; i++) {
                addStartAndEndToDates(this.reservations[i].start,
                                      this.reservations[i].end);
            }

            dates.sort(function(date1, date2) {
                return date1 > date2;
            });

            for (var d = 1; d < dates.length; d++) {
                if (dates[d-1].getTime() == dates[d].getTime())
                    continue;

                var end = new Date(dates[d]);
                end.setDate(end.getDate() - 1);
                var slice = new BlockPuzzle.Slice(dates[d-1], end);
                slice.freeTime = this.freeTime;
                this.slices.push(slice);
            }

            for (var r = 0; r < this.reservations.length; r++) {
                var reservation = this.reservations[r];
                for (var s = 0; s < this.slices.length; s++) {
                    if (this.slices[s].containsReservation(reservation)) {
                        this.slices[s].reservations.push(reservation);
                    }
                }
            }

            for (var j = 0; j < this.slices.length; j++)
                this.slices[j].calculateHoursForReservations();
        };

        this.buildDOM = function(container) {
            if (this.transform === null)
                this.transform = document.createElementNS("http://www.w3.org/2000/svg", "g");

            container.appendChild(this.transform);

            if (this.rect === null) {
                this.rect = new BlockPuzzle.Rect();
                this.rect.setFill("rgba(0, 0, 0, 0)");
                this.rect.setStroke(BlockPuzzle.TRACK_BORDER_WIDTH,
                                    BlockPuzzle.COLOR_SCHEME.track_border);
            }

            this.transform.appendChild(this.rect.getElement());

            for (var i = 0; i < this.reservations.length; i++)
                this.reservations[i].buildDOM(this.transform);

            if (this.freeTime !== null)
                this.freeTime.buildDOM(this.transform);
        };

        this.setReservations = function(reservations) {
            this.reservations  = reservations;
            this.buildSlices();
        };

        this.positionAndSizeElements = function(canvas) {
            this.transform.setAttribute("transform",
                "translate(" + this.origin[0] + "," + this.origin[1] + ")");

            this.rect.setOrigin([0, 0]);
            this.rect.setSize([this.size[0], this.size[1]]);

            for (var i = 0; i < this.slices.length; i++) {
                var slice = this.slices[i];
                var x = canvas.getDateXCoordinate(slice.start) - canvas.dayWidth;
                var width = canvas.getDateXCoordinate(slice.end) - x;

                slice.origin = [x, this.origin[1]];
                slice.size = [width, BlockPuzzle.TRACK_HEIGHT];
                slice.addPointsToReservations(canvas.dayWidth);
            }

            for (var r = 0; r < this.reservations.length; r++) {
                this.reservations[r].positionAndSizeElements();
            }

            if (this.freeTime !== null)
                this.freeTime.positionAndSizeElements();
        };

        this.setMouseOverHandler = function(handler) {
            this.transform.onmousemove = handler.bind(this, this);
            this.rect.onmousemove = handler.bind(this, this);
        };

        this.setReservationMouseOverHandler = function(handler) {
            for (var r = 0; r < this.reservations.length; r++) {
                this.reservations[r].setMouseOverHandler(handler);
            }
            if (this.freeTime !== null)
                this.freeTime.setMouseOverHandler(handler);
        };

        var self = this;
        this.start = start;
        this.end = end;
        this.origin = [0, 0];
        this.size = [0, 0];
        this.name = name;
        this.transform = null;
        this.rect = null;
        this.reservations = [];
        this.slices = [];

        if (BlockPuzzle.FREE_TIME_ALLOCATION > 0) {
            this.freeTime = new BlockPuzzle.Reservation("Free",
                                                        this.start,
                                                        this.end,
                                                        BlockPuzzle.FREE_TIME_ALLOCATION);
        } else {
            this.freeTime = null;
        }
    },

    HoverBox: function(canvas) {
        this.remove = function() {
            if (this.element === null)
                return;

            document.body.removeChild(this.element);
            this.element = null;
        };

        this.setCanvasBoundingRect = function(rect) {
            this.canvasBoundingRect = rect;
        };

        this.setCurrentTrack = function(track) {
            this.currentTrack = track;
        };

        this.setCurrentReservation = function(reservation) {
            this.currentReservation = reservation;
        };

        this.element = document.createElement("div");
        this.element.style.fontFamily = "sans-serif";
        this.element.style.fontSize = "12px";
        this.element.style.width = "100px";
        this.element.style.background = "white";
        this.element.style.display = "none";
        this.element.style.padding = "10px";
        this.element.style.margin = "10px";
        this.element.style.border = "1px solid black";
        this.element.style.position = "absolute";
        this.element.style.boxShadow = "rgba(0, 0, 0, 0.5) 2px 2px 3px";

        // TODO: Set this based on the z index of the canvas.
        this.element.style.zIndex = "100";

        document.body.appendChild(this.element);

        var self = this;
        for (var i = 0; i < canvas.tracks.length; i++) {
            var track = canvas.tracks[i];
            track.setMouseOverHandler(this.setCurrentTrack.bind(self));
            track.setReservationMouseOverHandler(this.setCurrentReservation.bind(self));
        }

        canvas.element.onmousemove = function(event) {
            if (!event)
                event = window.event;

            var leftOrigin = event.pageX;
            if (self.canvasBoundingRect !== null && event.pageX + 140 > self.canvasBoundingRect.right)
                 leftOrigin = event.pageX - 140;

            if (self.currentTrack && self.currentReservation) {
                self.element.style.left = leftOrigin + "px";
                self.element.style.top = event.pageY + "px";
                self.element.innerHTML =
                    "<b>Person:</b> " + self.currentTrack.name + "<br/>" +
                    "<b>Working on:</b> " + self.currentReservation.name;
                self.element.style.display = "";
            } else {
                self.element.style.display = "none";
            }

            self.currentTrack = self.currentReservation = null;
        };

        canvas.element.onmouseleave = function(event) {
            self.element.style.display = "none";
        };

        this.currentReservation = null;
        this.currentTrack = null;
        this.canvasBoundingRect = null;
    },

    Canvas: function(elementName) {
        this.getDateOffsetXCoordinate = function(offset) {
            return (offset + 1) * this.dayWidth;
        };

        this.getDateXCoordinate = function(date) {
            // Expensive way to calculate the date offset in our date range, that avoids
            // tricky calculations involving daylight savings time.
            for (var i = 0; i < this.dates.length; i++) {
                if (this.dates[i].containsDate(date))
                    return this.getDateOffsetXCoordinate(i);
            }
            console.error("Could not get offset for date: " + date);
            return 0;
        };

        this.positionAndSizeElements = function(object) {
            if (this.element === null)
                return;

            if (this.width == this.parentElement.clientWidth &&
                this.height == this.parentElement.clientHeight)
                return;

            var heightBetweenTracks = BlockPuzzle.TRACK_HEIGHT + BlockPuzzle.TRACK_GAP;
            this.height = BlockPuzzle.CANVAS_TOP_LABEL_HEIGHT +
                (heightBetweenTracks * this.tracks.length) - BlockPuzzle.TRACK_GAP;
            this.width = this.parentElement.clientWidth;
            this.trackWidth = canvas.width - BlockPuzzle.TRACK_LEFT_LABEL_WIDTH;
            this.dayWidth = this.trackWidth / this.dates.length;

            this.element.style.width = this.width;
            this.element.style.height = this.height;
            this.element.setAttribute("viewBox", "0 0 " + this.width + " " + this.height);
            this.chartBodyTransform.setAttribute("transform",
                "translate(" + BlockPuzzle.TRACK_LEFT_LABEL_WIDTH + ", " +
                               BlockPuzzle.CANVAS_TOP_LABEL_HEIGHT + ")");

            for (var i = 0; i < this.dates.length; i++) {
                this.dates[i].positionAndSizeElements(canvas, i);
            }

            for (var j = 0; j < this.monthLabels.length; j++) {
                var label = this.monthLabels[j];
                var origin =
                    [BlockPuzzle.TRACK_LEFT_LABEL_WIDTH + canvas.getDateXCoordinate(label.date),
                     BlockPuzzle.CANVAS_TOP_LABEL_HEIGHT - BlockPuzzle.LABEL_GAP];

                label.setAttribute("x", origin[0]);
                label.setAttribute("y", origin[1]);
                label.setAttribute("transform", "rotate(-30, " + origin + ")");
            }

            for (var k = 0; k < this.tracks.length; k++) {
                var trackYOrigin = heightBetweenTracks * k;
                var track = this.tracks[k];
                track.origin = [0, trackYOrigin];
                track.size = [this.trackWidth, BlockPuzzle.TRACK_HEIGHT];
                track.positionAndSizeElements(canvas);

                var trackLabel = this.trackLabels[k];
                trackLabel.setAttribute("y", BlockPuzzle.CANVAS_TOP_LABEL_HEIGHT +
                                             trackYOrigin + (heightBetweenTracks / 2));
                trackLabel.setAttribute("x",
                                        BlockPuzzle.TRACK_LEFT_LABEL_WIDTH - BlockPuzzle.LABEL_GAP);
            }

            this.hoverBox.setCanvasBoundingRect(this.element.getBoundingClientRect());
        };

        this.fillDatesArray = function() {
            this.dates = [];
            var currentDate = this.startDate;
            while (currentDate <= this.endDate) {
                var nextDate = new Date(currentDate);
                nextDate.setDate(currentDate.getDate() + 1);

                this.dates.push(new BlockPuzzle.Day(currentDate, nextDate.getDate() == 1));

                currentDate = nextDate;
            }
        };

        this.calculateStartAndEndDatesFromData = function(data) {
            this.startDate = null;
            this.endDate = null;

            var tracks = data.tracks;
            for (var i = 0; i < tracks.length; i++) {
                for (var j = 0; j < tracks[i].reservations.length; j++) {
                    var reservation = tracks[i].reservations[j];
                    if (this.startDate === null || this.startDate > reservation.start) {
                        this.startDate =
                            new Date(reservation.start.getFullYear(), 0, 1, 0, 0, 0, 0);
                    }

                    if (this.endDate === null || this.endDate < reservation.end) {
                        this.endDate =
                            new Date(reservation.end.getFullYear(), 11, 31, 0, 0, 0, 0);
                    }
                }
            }

            if (this.startDate === null || this.endDate === null) {
                console.warn("No valid data, not building dates array.");
                return;
            }

            this.fillDatesArray();
        };

        this.setData = function(data) {
            this.tracks = [];
            this.dates = [];

            this.calculateStartAndEndDatesFromData(data);

            var tracks = data.tracks;
            for (var i = 0; i < tracks.length; i++) {
                var track = new BlockPuzzle.Track(tracks[i].name, this.startDate, this.endDate);
                var reservations = [];
                for (var j = 0; j < tracks[i].reservations.length; j++) {
                    var reservation = tracks[i].reservations[j];
                    reservations.push(new BlockPuzzle.Reservation(reservation.name,
                                                                  reservation.start,
                                                                  reservation.end,
                                                                  reservation.hours));
                }
                track.setReservations(reservations);
                this.tracks.push(track);
            }

            this.buildDOM();
            this.positionAndSizeElements();
        };

        this.createLabel = function(text) {
            var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("font-size", BlockPuzzle.LABEL_FONT_SIZE);
            label.setAttribute("font-family", BlockPuzzle.LABEL_FONT_FAMILY);
            label.setAttribute("fill", BlockPuzzle.COLOR_SCHEME.label);
            label.appendChild(document.createTextNode(text));
            return label;
        };

        this.createTrackLabel = function(track) {
            var label = this.createLabel(track.name);
            label.setAttribute("text-anchor", "end");
            this.trackLabels.push(label);
            return label;
        };

        this.createMonthLabel = function(date) {
            // FIXME: We can do better than this. Consider Moment.js.
            var text = ["Jan", "Feb", "Mar", "Apr",
                        "May", "Jun", "Jul", "Aug",
                        "Sep", "Oct", "Nov", "Dec"][date.getMonth()] +
                       " " + date.getFullYear();

            var label = this.createLabel(text);
            label.date = date;
            this.monthLabels.push(label);
            return label;
        };

        this.buildDOM = function() {
            if (this.element === null)
                return;

            while (this.element.firstChild) {
                this.element.removeChild(this.element.firstChild);
            }

            this.trackLabels = [];
            this.monthLabels = [];

            this.chartBodyTransform =
                document.createElementNS("http://www.w3.org/2000/svg", "g");
            this.chartBodyTransform.setAttribute("transform",
                "translate(" + BlockPuzzle.TRACK_LEFT_LABEL_WIDTH + ", 0)");
            this.element.appendChild(this.chartBodyTransform);

            for (var i = 0; i < this.dates.length; i++) {
                this.dates[i].buildDOM(this.chartBodyTransform);
                var date = this.dates[i].date;
                if (date.getDate() == 1)
                    this.element.appendChild(this.createMonthLabel(date));
            }

            for (var j = 0; j < this.tracks.length; j++) {
                this.tracks[j].buildDOM(this.chartBodyTransform);
                this.element.appendChild(this.createTrackLabel(this.tracks[j]));
            }

            if (this.hoverBox !== null)
                this.hoverBox.remove();
            this.hoverBox = new BlockPuzzle.HoverBox(this);
        };

        var self = this;
        this.tracks = [];
        this.dates = [];
        this.trackLabels = [];
        this.chartBodyTransform = null;
        this.hoverBox = null;

        // Allow a null element for testing purposes.
        if (elementName !== null) {
            this.parentElement = document.getElementById(elementName);
            this.element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            this.parentElement.appendChild(this.element);
        } else {
            this.element = null;
        }

        var this_ = this;
        window.onresize = function() {
            this_.positionAndSizeElements();
        };
    },

    getDateForQuarter: function(quarterNumber, quarterYear, lastDay) {
        if (!lastDay) {
            return new Date(quarterYear, (quarterNumber - 1) * 3, 1, 0, 0, 0, 0);
        } else {
            // The day field is 1-indexed, so selecting zero as the day
            // should create a date representing the last day of the previous
            // month.
            return new Date(quarterYear, quarterNumber * 3, 0, 0, 0, 0, 0);
        }
    },

    convertTextToData: function(text) {
        var lines = text.split("\n");
        var data = {tracks: []};
        var settingRegex = /^(\w+):([^\n]*)$/;
        var trackRegex = /^\s*\*([^\n]+)$/;
        var reservationRegex = /^\s*-([^:]+):\s*([^\n]*)\s*$/;
        var currentTrack = null;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].replace("\n", "");

            var settingMatch = settingRegex.exec(line);
            if (settingMatch) {
                var key = settingMatch[1].toLowerCase().trim();
                var value = settingMatch[2].trim();
                data[key] = value;
                continue;
            }

            var trackMatch = trackRegex.exec(line);
            if (trackMatch) {
                var trackName = trackMatch[1].trim();
                if (trackName.length === 0)
                    continue;

                currentTrack = { name: trackName, reservations: [] };
                data.tracks.push(currentTrack);
                continue;
            }

            var reservationMatch = reservationRegex.exec(line);
            if (reservationMatch) {
                if (currentTrack === null) {
                    console.error("Couldn't add reservation, because no current Track.");
                    continue;
                }
                var reservationName = reservationMatch[1].trim();
                if (reservationName.length === 0)
                    continue;

                var dateAndHoursStrings = reservationMatch[2].split(",");
                var dateRangeString = dateAndHoursStrings[0].trim();
                var dates = BlockPuzzle.dateRangeToDates(dateRangeString);
                if (dates === null) {
                    console.error("Couldn't parse date range string '" + dateRangeString + "'");
                    continue;
                }


                var hours = null;
                if (dateAndHoursStrings.length > 1) {
                    hours = BlockPuzzle.hoursStringToHours(dateAndHoursStrings[1].trim());
                }

                currentTrack.reservations.push({
                    name: reservationName,
                    start: dates[0],
                    end: dates[1],
                    hours: hours,
                });
            }
        }

        return data;
    },

    hoursStringToHours: function(hoursString) {
        var hoursRegex = /^(\d+\.?\d*)/;
        var match = hoursRegex.exec(hoursString);
        if (!match)
            return null;

        return Number.parseFloat(match[1]);
    },

    dateStringToDate: function(dateString) {
        var fullDateRegex = /^(\d\d?)\/(\d\d?)\/(\d\d\d\d)/;
        var match = fullDateRegex.exec(dateString);
        if (match) {
            return new Date(Number.parseInt(match[3]),
                            Number.parseInt(match[2]) - 1, // Month is zero-indexed.
                            Number.parseInt(match[1]),
                            0, 0, 0, 0);
        }

        var quarterRegex = /^Q([1,2,3,4])\/(\d\d\d\d)/;
        match = quarterRegex.exec(dateString);
        if (match) {
            return BlockPuzzle.getDateForQuarter(Number.parseInt(match[1]),
                                                 Number.parseInt(match[2]),
                                                 false);
        }

        return null;
    },

    dateRangeToDates: function(dateString) {
        var quarterRangeRegex = /Q([1,2,3,4])\/(\d\d\d\d)\s*-\s*Q([1,2,3,4])\/(\d\d\d\d)/;
        var match = quarterRangeRegex.exec(dateString);
        if (match) {
            var quarter1 = Number.parseInt(match[1]);
            var year1 = Number.parseInt(match[2]);
            var quarter2 = Number.parseInt(match[3]);
            var year2 = Number.parseInt(match[4]);
            var start = BlockPuzzle.getDateForQuarter(quarter1, year1, false);
            var end = BlockPuzzle.getDateForQuarter(quarter2, year2, true);
            if (start > end) { // Reverse range.
                start = BlockPuzzle.getDateForQuarter(quarter2, year2, false);
                end = BlockPuzzle.getDateForQuarter(quarter1, year1, true);
            }

            return [start, end];
        }

        var rangeRegex = /([^-]+)-([^-]+)/;
        match = rangeRegex.exec(dateString);
        if (match) {
            var date1 = BlockPuzzle.dateStringToDate(match[1].trim());
            var date2 = BlockPuzzle.dateStringToDate(match[2].trim());
            if (date1 > date2)
                return [date2, date1];
            else
                return [date1, date2];
        }


        var quarterRegex = /Q([1,2,3,4])\/(\d\d\d\d)/;
        match = quarterRegex.exec(dateString);
        if (match) {
            var quarter = Number.parseInt(match[1]);
            var year = Number.parseInt(match[2]);
            return [BlockPuzzle.getDateForQuarter(quarter, year, false),
                    BlockPuzzle.getDateForQuarter(quarter, year, true)];
        }

        return null;
    },
};

BlockPuzzle.Reservation.getColorForReservation = function(reservation) {
    if (BlockPuzzle.Reservation.colorMap === undefined) {
        BlockPuzzle.Reservation.colorMap = {};
        BlockPuzzle.Reservation.unusedColors = BlockPuzzle.COLOR_SCHEME.reservations.slice();
    }

    var colorMap = BlockPuzzle.Reservation.colorMap;
    var key = "__" + reservation.name;
    if (colorMap[key] === undefined) {
        if (BlockPuzzle.Reservation.unusedColors.length === 0)
            BlockPuzzle.Reservation.unusedColors = BlockPuzzle.COLOR_SCHEME.reservations.slice();
        colorMap[key] = BlockPuzzle.Reservation.unusedColors.pop();
    }

    return colorMap[key];
};
