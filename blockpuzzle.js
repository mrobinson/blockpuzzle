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
    Options: function(template) {
        this.override = function(key, value) {
            let number_keys = [
                "AVAILABLE_HOURS", "FREE_TIME_HOURS", "TRACK_HEIGHT", "TRACK_BORDER_WIDTH",
                "TRACK_GAP", "LABEL_GAP", "LABEL_FONT_SIZE", "TRACK_LEFT_LABEL_WIDTH",
                "CANVAS_TOP_LABEL_HEIGHT", "RESERVATION_PADDING",
            ];
            for (let number_key of number_keys) {
                if (number_key == key) {
                    this[key] = parseFloat(value);
                    return;
                }
            }

            if (key == "LABEL_FONT_FAMILY") {
                this[key] = value;
                return;
            }

            console.warn("Tried to set unknown setting: " + key);
        };

        this.LABEL_FONT_FAMILY =  "sans-serif";

        this.AVAILABLE_HOURS =  40;

        // When reservations don't have any hours specified, free time can optionally steal
        // some of those hours. These hours, as with other reservations with no hours
        // specified will not be allocated if the available hours are totally consumed.
        this.FREE_TIME_HOURS = 5;

        // The height of the track.
        this.TRACK_HEIGHT = 40;

        // The size of the border that surrounds tracks.
        this.TRACK_BORDER_WIDTH = 2;

        this.TRACK_GAP = 10;

        // The gap between labels and the thing that they point to.
        this.LABEL_GAP = 8;

        // The font size for the labels.
        this.LABEL_FONT_SIZE = 10;

        // The font family for the labels.
        this.ABEL_FONT_FAMILY = "sans-serif";

        // The space on the left hand side of the chart used to print the track name.
        this.TRACK_LEFT_LABEL_WIDTH = 100;

        // The space on the left hand side of the chart used to print the track name.
        this.CANVAS_TOP_LABEL_HEIGHT = 40;

        // The vertical padding between reservations within a track.
        this.RESERVATION_PADDING = 1;

        this.COLOR_SCHEME = {
            label: "black",
            track_border: "rgba(75, 75, 75, 1)",
            month_line: "rgba(0, 75, 75, 0.5)",
            day_line: "rgba(200, 200, 200, 0.4)",
            highlight_line: "rgba(200, 0, 0, 1)",
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
        };
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

    Day: function(date, options) {
        this.buildDOM = function(container) {
            if (this.line === null) {
                this.line = new BlockPuzzle.Line();
                if (this.firstDayOfMonth)
                    this.line.setStroke(2, this.options.COLOR_SCHEME.month_line);
                else
                    this.line.setStroke(1, this.options.COLOR_SCHEME.day_line);
            }

            container.appendChild(this.line.getElement());
        };

        this.getMonthString = function() {
            // FIXME: We can do better than this. Consider Moment.js.
            return  ["Jan", "Feb", "Mar", "Apr",
                     "May", "Jun", "Jul", "Aug",
                     "Sep", "Oct", "Nov", "Dec"][date.getMonth()] +
                    " " + date.getFullYear();
        };

        this.getDateString = function() {
            // FIXME: We can do better than this. Consider Moment.js.
            return this.date.getDate() + " " + this.getMonthString();
        };

        this.positionAndSizeElements = function(dateGrid) {
            this.line.setPoints([this.origin[0], this.origin[1]],
                                [this.origin[0], this.size[1]]);
        };

        this.setVisible = function(visible) {
            this.line.setVisible(visible);
        };

        this.containsDate = function(date) {
            return date.getFullYear() == this.date.getFullYear() &&
                   date.getMonth() == this.date.getMonth() &&
                   date.getDate() == this.date.getDate();
        };

        this.options = options;
        if (this.options === undefined)
            this.options = BlockPuzzle.Options.defaults();

        this.line = null;
        this.date = date;
        this.origin = [0, 0];
        this.size = [0, 0];
        this.firstDayOfMonth = date.getDate() == 1;
    },

    DateGrid: function(startDate, endDate, options) {
        this.buildDOM = function(container) {
            for (var i = 0; i < this.days.length; i++) {
                this.days[i].buildDOM(container);
            }

            this.highlightLine = new BlockPuzzle.Line();
            this.highlightLine.setVisible(false);
            this.highlightLine.setStroke(2, this.options.COLOR_SCHEME.highlight_line);
            container.appendChild(this.highlightLine.getElement());
        };

        this.getOriginForDayIndex = function(dayIndex) {
            // Extend month lines up into the label region a bit.
            var monthOffset = -(this.options.TRACK_BORDER_WIDTH / 2) - this.options.LABEL_GAP + 2;
            return [
                this.origin[0] + (dayIndex * this.dayWidth),
                this.origin[1] + this.days[dayIndex].firstDayOfMonth ? monthOffset : 0
            ];
        };

        this.getOriginForDate = function(date) {
            // Expensive way to calculate the date offset in our date range, that avoids
            // tricky calculations involving daylight savings time.
            for (var i = 0; i < this.days.length; i++) {
                if (this.days[i].containsDate(date))
                    return this.getOriginForDayIndex(i);
            }
            console.error("Could not get offset for date: " + date);
            return [0, 0];
        };

        this.positionAndSizeElements = function() {
            this.dayWidth = this.size[0] / this.days.length;
            for (var i = 0; i < this.days.length; i++) {
                var day = this.days[i];
                day.size = [0, this.size[1]];
                day.origin = this.getOriginForDayIndex(i);
                day.setVisible(day.firstDayOfMonth || this.dayWidth > 2);
                day.positionAndSizeElements(this);
            }
        };

        this.forEachDay = function(callback) {
            for (var i = 0; i < this.days.length; i++) {
                callback(this.days[i]);
            }
        };

        this.handleMouseMove = function(x, y) {
            x -= this.origin[0];
            y -= this.origin[1];

            if (x < 0 || x > this.size[0] || y < 0 || y > this.size[1]) {
                this.handleMouseLeave();
                return;
            }

            var index = Math.round(x / this.dayWidth);
            var origin = this.getOriginForDayIndex(index);
            this.highlightLine.setPoints(
                [origin[0], origin[1]],
                [origin[0], this.size[1]]);
            this.highlightLine.setVisible(true);
            this.hoveredDay = this.days[index];
        };

        this.handleMouseLeave = function(x, y) {
            this.highlightLine.setVisible(false);
            this.hoveredDay = null;
        };

        this.days = [];
        this.elements = [];
        this.startDate = startDate;
        this.endDate = endDate;
        this.origin = [0, 0];
        this.size = [0, 0];
        this.highlightLine = null;
        this.hoveredDay = null;

        this.options = options;
        if (this.options === undefined)
            this.options = BlockPuzzle.Options.defaults();

        var currentDate = new Date(this.startDate);
        while (currentDate <= this.endDate) {
            this.days.push(new BlockPuzzle.Day(currentDate, this.options));
            currentDate = new Date(currentDate);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    },

    Reservation: function(name, start, end, hours, confirmed, options) {
        this.buildDOM = function(container) {
            if (this.path === null)
                this.path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            container.appendChild(this.path);
        };

        this.positionAndSizeElements = function() {
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
            this.path.setAttribute("fill-opacity", this.confirmed ? "1" : "0.6");

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
            this.path.addEventListener("mousemove", handler.bind(this, this));
        };

        this.options = options;
        if (this.options === undefined)
            this.options = BlockPuzzle.Options.defaults();

        this.name = name;

        // Normalize dates to all be at midnight.
        this.start = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0));
        this.end = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0));
        this.confirmed = confirmed === undefined || confirmed;
        this.topPoints = [];
        this.bottomPoints = [];
        this.path = null;

        if (hours !== undefined && hours !== null)
            this.hours = hours;
        else
            this.hours = null;
    },

    Slice: function(start, end, options) {
        this.totalHoursReserved = function() {
            var total = this.unusedHours;
            for (var i = 0; i < this.reservationHours.length; i++)
                total += this.reservationHours[i];
            return total;
        };

        this.addPointsToReservations = function(dayWidth) {
            var numReservations = this.reservations.length;

            var totalHours = this.totalHoursReserved();
            if (totalHours < this.options.AVAILABLE_HOURS)
                totalHours = this.options.AVAILABLE_HOURS;

            var totalPadding = (numReservations * this.options.RESERVATION_PADDING) +
                (this.options.TRACK_BORDER_WIDTH / 2);
            var reservationHeightPerHour = (this.size[1] - totalPadding) / totalHours;
            var totalDrawnHeight = (totalHours * reservationHeightPerHour) + totalPadding;
            var offset = 0;

            var origin = this.origin;
            var size = this.size;
            function setReservationPoints(reservation, offset, height) {
                reservation.addPoints([origin[0], offset], [origin[0], offset + height], dayWidth);
                reservation.addPoints([origin[0] + size[0], offset],
                                      [origin[0] + size[0], offset + height], dayWidth);
            }

            offset += this.options.TRACK_BORDER_WIDTH / 2;
            for (var i = 0; i < this.reservations.length; i++) {
                var reservationHeight = reservationHeightPerHour * this.reservationHours[i];
                setReservationPoints(this.reservations[i], offset, reservationHeight);
                offset += reservationHeight + this.options.RESERVATION_PADDING;
            }
        };

        this.calculateHoursForReservations = function() {
            this.reservationHours = [];
            var hoursLeft = this.options.AVAILABLE_HOURS;
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

            this.unusedHours = 0;
            if (hoursLeft > 0) {
                hoursLeft -= this.options.FREE_TIME_HOURS;
                this.unusedHours = this.options.FREE_TIME_HOURS;
            }
            if (numReservationsWithoutHours === 0) {
                this.unusedHours += Math.max(hoursLeft, 0);
                return;
            }

            var hoursPerRemainingReservation = hoursLeft <= 0 ?
                 0 : (hoursLeft / numReservationsWithoutHours);
            for (var j = 0; j < this.reservations.length; j++) {
                if (null === this.reservationHours[j])
                    this.reservationHours[j] = hoursPerRemainingReservation;
            }
        };

        this.getHoursAllocatedForReservation = function(reservation) {
            for (var i = 0; i < this.reservations.length; i++) {
                if (this.reservations[i] === reservation)
                    return this.reservationHours[i];
            }
            return 0;
        };

        this.containsReservation = function(reservation) {
            return reservation.end >= this.start && reservation.start < this.end;
        };

        this.options = options;
        if (this.options === undefined)
            this.options = BlockPuzzle.Options.defaults();

        this.start = start;
        this.end = end;
        this.reservations = [];
        this.size = null;
        this.origin = null;
        this.reservationHours = [];
        this.unusedHours = 0;
    },

    Track: function(name, start, end, options) {
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
                return date1.getTime() - date2.getTime();
            });

            for (var d = 1; d < dates.length; d++) {
                if (dates[d-1].getTime() == dates[d].getTime())
                    continue;

                var end = new Date(dates[d]);
                end.setDate(end.getDate() - 1);
                var slice = new BlockPuzzle.Slice(dates[d-1], end, this.options);
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

        this.getSliceAtDay = function(day) {
            for (var i = 0; i < this.slices.length; i++) {
                var slice = this.slices[i];
                if (slice.start <= day.date && slice.end >= day.date)
                    return slice;
            }
            return null;
        };

        this.buildDOM = function(container) {
            if (this.transform === null)
                this.transform = document.createElementNS("http://www.w3.org/2000/svg", "g");

            container.appendChild(this.transform);

            if (this.rect === null) {
                this.rect = new BlockPuzzle.Rect();
                this.rect.setFill("rgba(0, 0, 0, 0)");
                this.rect.setStroke(this.options.TRACK_BORDER_WIDTH,
                                    this.options.COLOR_SCHEME.track_border);
            }

            this.transform.appendChild(this.rect.getElement());

            for (var i = 0; i < this.reservations.length; i++)
                this.reservations[i].buildDOM(this.transform);
        };

        this.setReservations = function(reservations) {
            this.reservations  = reservations;
            this.buildSlices();
        };

        this.positionAndSizeElements = function(dateGrid) {
            this.transform.setAttribute("transform",
                "translate(" + this.origin[0] + "," + this.origin[1] + ")");

            this.rect.setOrigin([0, 0]);
            this.rect.setSize([this.size[0], this.size[1]]);

            for (var i = 0; i < this.slices.length; i++) {
                var slice = this.slices[i];
                var x = dateGrid.getOriginForDate(slice.start)[0];
                var width = dateGrid.getOriginForDate(slice.end)[0] + dateGrid.dayWidth - x;

                slice.origin = [x, this.origin[1]];
                slice.size = [width, this.options.TRACK_HEIGHT];
                slice.addPointsToReservations(dateGrid.dayWidth);
            }

            for (var r = 0; r < this.reservations.length; r++) {
                this.reservations[r].positionAndSizeElements();
            }
        };

        this.setMouseOverHandler = function(handler) {
            this.transform.addEventListener("mousemove", handler.bind(this, this));
            this.rect.getElement().addEventListener("mousemove", handler.bind(this, this));
        };

        this.setReservationMouseOverHandler = function(handler) {
            for (var r = 0; r < this.reservations.length; r++) {
                this.reservations[r].setMouseOverHandler(handler);
            }
        };

        var self = this;

        this.options = options;
        if (this.options === undefined)
            this.options = BlockPuzzle.Options.defaults();

        this.start = start;
        this.end = end;
        this.origin = [0, 0];
        this.size = [0, 0];
        this.name = name;
        this.transform = null;
        this.rect = null;
        this.reservations = [];
        this.slices = [];
    },

    HoverBox: function(canvas) {
        this.handleMouseMove = function(event, reservation, slice, track, day) {
            if (!day) {
                this.element.style.display = "none";
                return;
            }

            var leftOrigin = event.pageX;
            var canvasBoundingRect = canvas.element.getBoundingClientRect();
            if (event.pageX + 140 > canvasBoundingRect.right)
                 leftOrigin = event.pageX - 140;

            this.element.style.left = leftOrigin + "px";
            this.element.style.top = event.pageY + "px";

            this.dateHeader.innerText = day.getDateString();
            if (track !== null && reservation !== null) {
                this.reservationName.innerText = reservation.name;
                this.reservationHours.innerText =
                    slice.getHoursAllocatedForReservation(reservation).toFixed(2) + " hours / week";
                this.reservationDetails.style.display = "";
            } else {
                this.reservationDetails.style.display = "none";
            }

            this.element.style.display = "";
        };

        this.hide = function() {
            this.element.style.display = "none";
        };

        this.element = document.createElement("div");
        this.element.style.fontFamily = "sans-serif";
        this.element.style.fontSize = "15px";
        this.element.style.fontWeight = "bold";
        this.element.style.textAlign = "center";
        this.element.style.background = "white";
        this.element.style.display = "none";
        this.element.style.margin = "10px";
        this.element.style.border = "1px solid rgba(0, 0, 0, 0.4)";
        this.element.style.position = "absolute";
        this.element.style.boxShadow = "rgba(0, 0, 0, 0.3) 2px 2px 3px";

        // TODO: Set this based on the z-index of the canvas.
        this.element.style.zIndex = "100";

        this.dateHeader = document.createElement("div");
        this.dateHeader.style.boxSizing = "border-box";
        this.dateHeader.style.padding = "5px";
        this.dateHeader.style.background = "rgb(255, 255, 204)";
        this.dateHeader.style.width = "100%";
        this.element.appendChild(this.dateHeader);

        this.reservationDetails = document.createElement("div");
        this.reservationDetails.style.padding = "5px";
        this.reservationDetails.style.paddingTop = "10px";
        this.element.appendChild(this.reservationDetails);

        this.reservationName = document.createElement("span");
        this.reservationHours = document.createElement("span");
        this.reservationHours.style.fontWeight = "normal";

        this.reservationDetails.appendChild(this.reservationName);
        this.reservationDetails.appendChild(document.createElement("br"));
        this.reservationDetails.appendChild(this.reservationHours);

        document.body.appendChild(this.element);

        this.canvas = canvas;
    },

    Canvas: function(elementName) {
        this.positionAndSizeElements = function(object) {
            if (this.element === null)
                return;

            if (this.size[0] == this.parentElement.clientWidth &&
                this.size[1] == this.parentElement.clientHeight)
                return;

            var trackBorderWidth = this.options.TRACK_BORDER_WIDTH;
            var heightBetweenTracks =
                this.options.TRACK_HEIGHT + this.options.TRACK_GAP + trackBorderWidth;
            var heightForTracks = (heightBetweenTracks * this.tracks.length) - this.options.TRACK_GAP;

            this.size = [
                this.parentElement.clientWidth,
                heightForTracks + this.options.CANVAS_TOP_LABEL_HEIGHT
            ];
            this.element.style.width = this.size[0];
            this.element.style.height = this.size[1];
            this.element.setAttribute("viewBox", "0 0 " + this.size[0] + " " + this.size[1]);

            var labelOffset = [this.options.TRACK_LEFT_LABEL_WIDTH, this.options.CANVAS_TOP_LABEL_HEIGHT];
            this.chartBodyTransform.setAttribute("transform",
                "translate(" + labelOffset[0] + ", " + labelOffset[1] + ")");

            var halfTrackBorderWidth = trackBorderWidth / 2;
            var widthForTracks = this.size[0] - this.options.TRACK_LEFT_LABEL_WIDTH - halfTrackBorderWidth;
            this.dateGrid.size = [widthForTracks - halfTrackBorderWidth, heightForTracks - halfTrackBorderWidth];
            this.dateGrid.origin = [trackBorderWidth / 2, 0];
            this.dateGrid.positionAndSizeElements();

            for (var j = 0; j < this.monthLabels.length; j++) {
                var label = this.monthLabels[j];
                var origin = [
                    labelOffset[0] + this.dateGrid.getOriginForDate(label.date)[0],
                    labelOffset[1] - this.options.LABEL_GAP
                ];

                label.setAttribute("x", origin[0]);
                label.setAttribute("y", origin[1]);
                label.setAttribute("transform", "rotate(-30, " + origin + ")");
            }

            for (var k = 0; k < this.tracks.length; k++) {
                var trackYOrigin = heightBetweenTracks * k;
                var track = this.tracks[k];
                track.origin = [0, trackYOrigin];
                track.size = [widthForTracks, this.options.TRACK_HEIGHT];
                track.positionAndSizeElements(this.dateGrid);

                var trackLabel = this.trackLabels[k];
                trackLabel.setAttribute("y", this.options.CANVAS_TOP_LABEL_HEIGHT +
                                             trackYOrigin + (heightBetweenTracks / 2));
                trackLabel.setAttribute("x",
                                        this.options.TRACK_LEFT_LABEL_WIDTH - this.options.LABEL_GAP);
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
                        this.startDate = new Date(reservation.start);
                        this.startDate.setDate(1);
                    }

                    if (this.endDate === null || this.endDate < reservation.end) {
                        this.endDate = new Date(reservation.end);
                        this.endDate.setMonth(this.endDate.getMonth() + 1);
                        this.endDate.setDate(0);
                    }
                }
            }

            if (this.startDate === null || this.endDate === null) {
                console.warn("No valid data, not building dates array.");
                return;
            }

            this.dateGrid = new BlockPuzzle.DateGrid(this.startDate, this.endDate, this.options);
        };

        this.setOptions = function(data) {
            this.options = data.options;
        };

        this.setData = function(data) {
            this.data = data;
            this.rebuild();
        };

        this.rebuild = function() {
            this.tracks = [];
            this.calculateStartAndEndDatesFromData(this.data);

            var tracks = this.data.tracks;
            for (var i = 0; i < tracks.length; i++) {
                var track = new BlockPuzzle.Track(tracks[i].name,
                                                  this.startDate,
                                                  this.endDate,
                                                  this.options);

                var reservations = [];
                for (var j = 0; j < tracks[i].reservations.length; j++) {
                    var reservation = tracks[i].reservations[j];
                    reservations.push(new BlockPuzzle.Reservation(reservation.name,
                                                                  reservation.start,
                                                                  reservation.end,
                                                                  reservation.hours,
                                                                  reservation.confirmed,
                                                                  this.options));
                }
                track.setReservations(reservations);
                this.tracks.push(track);
            }

            this.buildDOM();
            this.positionAndSizeElements();
        };

        this.createLabel = function(text) {
            var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("font-size", this.options.LABEL_FONT_SIZE);
            label.setAttribute("font-family", this.options.LABEL_FONT_FAMILY);
            label.setAttribute("fill", this.options.COLOR_SCHEME.label);
            label.appendChild(document.createTextNode(text));
            return label;
        };

        this.createTrackLabel = function(track) {
            var label = this.createLabel(track.name);
            label.setAttribute("text-anchor", "end");
            this.trackLabels.push(label);
            return label;
        };

        this.createMonthLabel = function(day) {
            var label = this.createLabel(day.getMonthString());
            label.date = day.date;
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
                "translate(" + this.options.TRACK_LEFT_LABEL_WIDTH + ", 0)");
            this.element.appendChild(this.chartBodyTransform);

            this.dateGrid.buildDOM(this.chartBodyTransform);

            this.dateGrid.forEachDay(function(day) {
                if (day.firstDayOfMonth)
                    this.element.appendChild(this.createMonthLabel(day));
            }.bind(this));

            for (var j = 0; j < this.tracks.length; j++) {
                this.tracks[j].buildDOM(this.chartBodyTransform);
                this.element.appendChild(this.createTrackLabel(this.tracks[j]));
            }

            this.createHoverBox();
        };

        this.createHoverBox = function() {
            if (this.hoverBox === null)
                this.hoverBox = new BlockPuzzle.HoverBox(this);

            var setHoveredTrack = function(track) {
                this.hoveredTrack = track;
            }.bind(this);

            var setHoveredReservation = function(reservation) {
                this.hoveredReservation = reservation;
            }.bind(this);

            for (var i = 0; i < this.tracks.length; i++) {
                var track = this.tracks[i];
                track.setMouseOverHandler(setHoveredTrack);
                track.setReservationMouseOverHandler(setHoveredReservation);
            }

            this.element.addEventListener("mousemove", function(event) {
                if (!event)
                    event = window.event;

                var canvasRect = this.element.getBoundingClientRect();

                this.dateGrid.handleMouseMove(
                    event.clientX - this.options.TRACK_LEFT_LABEL_WIDTH - canvasRect.left,
                    event.clientY - this.options.CANVAS_TOP_LABEL_HEIGHT - canvasRect.top);
                this.hoveredDay = this.dateGrid.hoveredDay;
                var slice = this.hoveredDay !== null && this.hoveredTrack !== null ?
                    this.hoveredTrack.getSliceAtDay(this.hoveredDay) : null;
                this.hoverBox.handleMouseMove(event,
                                              this.hoveredReservation,
                                              slice,
                                              this.hoveredTrack,
                                              this.hoveredDay);

                // Reset these so that we can detect when we go off
                // the edge of a reservation path.
                this.hoveredTrack = null;
                this.hoveredReservation = null;
                this.hoveredDay = null;
            }.bind(this));

            this.element.addEventListener("mouseleave", function(event) {
                this.hoverBox.hide();
                this.dateGrid.handleMouseLeave();
            }.bind(this));
        };

        var self = this;
        this.options = BlockPuzzle.Options.defaults();
        this.size = [0, 0];
        this.tracks = [];
        this.trackLabels = [];
        this.chartBodyTransform = null;
        this.hoverBox = null;

        this.hoveredReservation = null;
        this.hoveredTrack = null;
        this.hoveredDay = null;

        // Allow a null element for testing purposes.
        if (elementName !== null) {
            this.parentElement = document.getElementById(elementName);
            this.element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            this.parentElement.appendChild(this.element);
        } else {
            this.element = null;
        }

        window.addEventListener("resize", function() {
            this.positionAndSizeElements();
        }.bind(this));
    },

    getDateForWeek: function(weekNumber, weekYear, lastDay) {
        var millisecondsInADay = 1000 * 60 * 60 * 24;

        // According to ISO 8601, week 1 of the year is the week that contains
        // January 4th. The first day of week 1 is the Monday of that week.
        // To find the first day of this week, we search backward by days to
        // find Monday.
        var mondayOfWeekOne = new Date(Date.UTC(weekYear, 0, 4));
        while (mondayOfWeekOne.getDay() != 1) {
            mondayOfWeekOne.setTime(mondayOfWeekOne.getTime() - millisecondsInADay);
        }
        var date = mondayOfWeekOne;

        if (!lastDay) {
            date.setTime(mondayOfWeekOne.getTime() +
                (millisecondsInADay * 7 * (weekNumber - 1)));
        } else {
            // since the lastDay is inclusive, we look six days ahead from the
            // first day of the week.
            date.setTime(mondayOfWeekOne.getTime() +
                (millisecondsInADay * ((7 * weekNumber) - 1)));
        }

        // For now, don't cross year boundaries from the week year. In the future,
        // there will be more options for setting the canvas boundary dates.
        if (weekNumber == 1 && date.getFullYear() != weekYear)
            return new Date(Date.UTC(weekYear, 0, 1));
        if (weekNumber != 1 && date.getFullYear() != weekYear)
            return new Date(Date.UTC(weekYear, 11, 31));

        return mondayOfWeekOne;
    },

    getDateForQuarter: function(quarterNumber, quarterYear, lastDay) {
        if (!lastDay) {
            return new Date(Date.UTC(quarterYear, (quarterNumber - 1) * 3, 1));
        } else {
            // The day field is 1-indexed, so selecting zero as the day
            // should create a date representing the last day of the previous
            // month.
            return new Date(Date.UTC(quarterYear, quarterNumber * 3, 0));
        }
    },

    getDateForHalf: function(halfNumber, halfYear, lastDay) {
        if (!lastDay) {
            return new Date(Date.UTC(halfYear, (halfNumber - 1) * 6, 1));
        } else {
            // The day field is 1-indexed, so selecting zero as the day
            // should create a date representing the last day of the previous
            // month.
            return new Date(Date.UTC(halfYear, halfNumber * 6, 0));
        }
    },


    convertTextToData: function(text) {
        var lines = text.split("\n");
        var data = {tracks: [], options: new BlockPuzzle.Options()};
        var settingRegex = /^(\w+):([^\n]*)$/;
        var trackRegex = /^\s*\*([^\n]+)$/;
        var reservationRegex = /^\s*(-|\+)([^:]+):\s*([^\n]*)\s*$/;
        var currentTrack = null;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].replace("\n", "");

            var settingMatch = settingRegex.exec(line);
            if (settingMatch) {
                var key = settingMatch[1].trim();
                var value = settingMatch[2].trim();
                data.options.override(key, value);
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
                var reservationName = reservationMatch[2].trim();
                if (reservationName.length === 0)
                    continue;

                var dateAndHoursStrings = reservationMatch[3].split(",");
                var dateRangeString = dateAndHoursStrings[0].trim();
                var dates = BlockPuzzle.dateRangeToDates(dateRangeString);
                if (dates === null || dates[0] === null || dates[1] === null) {
                    console.error("Couldn't parse date range string '" + dateRangeString +
                                  "' in reservation'" + reservationMatch[0] + "'");
                    continue;
                }


                var hours = null;
                if (dateAndHoursStrings.length > 1) {
                    hours = BlockPuzzle.hoursStringToHours(dateAndHoursStrings[1].trim(),
                                                           data.options);
                }

                currentTrack.reservations.push({
                    name: reservationName,
                    confirmed: reservationMatch[1] === "-",
                    start: dates[0],
                    end: dates[1],
                    hours: hours,
                });
            }
        }

        return data;
    },

    hoursStringToHours: function(hoursString, options) {
        let fteRegex = new RegExp("^(\\d+\\.?\\d*)\\s*fte", "i");
        let match = fteRegex.exec(hoursString);
        if (match)
            return parseFloat(match[1]) * options.AVAILABLE_HOURS;

        let hoursRegex = /^(\d+\.?\d*)/;
        match = hoursRegex.exec(hoursString);
        if (!match)
            return null;

        return parseFloat(match[1]);
    },

    dateStringToDate: function(dateString) {
        var fullDateRegex = /^(\d\d?)\/(\d\d?)\/(\d\d\d\d)/;
        var match = fullDateRegex.exec(dateString);
        if (match) {
            var date = new Date(Date.UTC(
                parseInt(match[3]),
                parseInt(match[2]) - 1, // Month is zero-indexed.
                parseInt(match[1])));
            return [date, date];
        }

        var monthDateRegex = /^(\d\d?)\/(\d\d\d\d)/;
        match = monthDateRegex.exec(dateString);
        if (match) {
            return [new Date(Date.UTC(
                        parseInt(match[2]),
                        parseInt(match[1]) - 1, // Month is zero-indexed.
                        1)),
                    // We want the last day of the month, so we return the
                    // 0th day of the next month, which should be the same.
                    new Date(Date.UTC(
                            parseInt(match[2]),
                            parseInt(match[1]),
                            0))];

        }

        var weekRegex = /^[wW](\d\d?)\/(\d\d\d\d)/;
        match = weekRegex.exec(dateString);
        if (match) {
            var a = [BlockPuzzle.getDateForWeek(parseInt(match[1]), parseInt(match[2]), false),
                    BlockPuzzle.getDateForWeek(parseInt(match[1]), parseInt(match[2]), true)];
            return a;
        }

        var quarterRegex = /^[qQ]([1,2,3,4])\/(\d\d\d\d)/;
        match = quarterRegex.exec(dateString);
        if (match) {
            return [BlockPuzzle.getDateForQuarter(parseInt(match[1]), parseInt(match[2]), false),
                    BlockPuzzle.getDateForQuarter(parseInt(match[1]), parseInt(match[2]), true)];
        }

        var halfRegex = /^[hH]([1,2])\/(\d\d\d\d)/;
        match = halfRegex.exec(dateString);
        if (match) {
            return [BlockPuzzle.getDateForHalf(parseInt(match[1]), parseInt(match[2]), false),
                    BlockPuzzle.getDateForHalf(parseInt(match[1]), parseInt(match[2]), true)];
        }

        var yearRegex = /^(\d\d\d\d)/;
        match = yearRegex.exec(dateString);
        if (match) {
            return [BlockPuzzle.getDateForHalf(1, parseInt(match[1]), false),
                    BlockPuzzle.getDateForHalf(2, parseInt(match[1]), true)];
        }

        return null;
    },

    dateRangeToDates: function(dateString) {
        if (dateString.search('-') != -1) {
            var bounds = dateString.split('-');
            var date1 = BlockPuzzle.dateStringToDate(bounds[0].trim());
            var date2 = BlockPuzzle.dateStringToDate(bounds[1].trim());

            if (date1 === null || date2 === null)
                return null;

            var dates = [date1[0], date2[1]];
            dates.sort(function (a, b) { return a - b; });

            return dates;
        } else {
            return BlockPuzzle.dateStringToDate(dateString);
        }
    },
};

BlockPuzzle.Reservation.getColorForReservation = function(reservation) {
    if (BlockPuzzle.Reservation.colorMap === undefined) {
        BlockPuzzle.Reservation.colorMap = {};
        BlockPuzzle.Reservation.unusedColors =
            reservation.options.COLOR_SCHEME.reservations.slice();
    }

    var colorMap = BlockPuzzle.Reservation.colorMap;
    var key = "__" + reservation.name;
    if (colorMap[key] === undefined) {
        if (BlockPuzzle.Reservation.unusedColors.length === 0)
            BlockPuzzle.Reservation.unusedColors =
                reservation.options.COLOR_SCHEME.reservations.slice();
        colorMap[key] = BlockPuzzle.Reservation.unusedColors.pop();
    }

    return colorMap[key];
};

BlockPuzzle.Options.defaults = function() {
    if (BlockPuzzle.Options.defaultOptions === undefined)
        BlockPuzzle.Options.defaultOptions = new BlockPuzzle.Options();
    return BlockPuzzle.Options.defaultOptions;
};
