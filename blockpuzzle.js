var BlockPuzzle = {
    TRACK_HEIGHT: 40,
    TRACK_BORDER_WIDTH: 1,
    TRACK_GAP: 5,
    RESERVATION_PADDING: 1,

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
        }

        this.bottomRight = function(size) {
            return [this.origin[0] + this.size[0], this.origin[1] + this.size[1]];
        }

        this.bottomLeft = function(size) {
            return [this.origin[0], this.origin[1] + this.size[1]];
        }

        this.setFill = function(fill) {
            this.element.style.fill = fill;
        };

        this.setStroke = function(width, color) {
            this.element.setAttribute("stroke", color);
            this.element.setAttribute("stroke-width", width);
        };

        this.element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.origin = [0, 0]
        this.size = [0, 0]
    },

    Day: function(date, lastDayOfMonth) {
        this.buildDOM = function(container) {
            if (this.line === null) {
                this.line = new BlockPuzzle.Line();
                if (this.lastDayOfMonth)
                    this.line.setStroke(2, "rgba(100, 100, 100, 0.5)");
                else
                    this.line.setStroke(1, "rgba(200, 200, 200, 0.4)");
            }

            container.appendChild(this.line.getElement());
        }

        this.positionAndSizeElements = function(canvas, dayIndex) {
            var x = canvas.getDateOffsetXCoordinate(dayIndex);
            this.line.setVisible(this.lastDayOfMonth || canvas.dayWidth > 2);
            this.line.setPoints([x, 0], [x, canvas.height]);
        }

        this.containsDate = function(date) {
            return date.getFullYear() == this.date.getFullYear() &&
                   date.getMonth() == this.date.getMonth() &&
                   date.getDate() == this.date.getDate();
        }

        this.line = null;
        this.date = date;
        this.lastDayOfMonth = lastDayOfMonth;
    },

    Reservation: function(name, start, end) {
        this.buildDOM = function(container) {
            if (this.path == null)
                this.path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            container.appendChild(this.path);
        }

        this.positionAndSizeElements = function(canvas) {
            var pathString = "M " + this.topPoints[0].join(" ") + " ";
            for (var j = 1; j < this.topPoints.length; j++) {
                pathString += "L " + this.topPoints[j].join(" ") + " ";
            }

            for (var j = this.bottomPoints.length - 1; j >= 0; j--) {
                pathString += "L " + this.bottomPoints[j].join(" ") + " ";
            }

            this.path.setAttribute("d", pathString);
            this.path.setAttribute("fill", "rgba(150, 0, 0, 1)");
            this.topPoints = [];
            this.bottomPoints = [];
        },

        this.addPoints = function(topPoint, bottomPoint) {
            this.topPoints.push(topPoint);
            this.bottomPoints.push(bottomPoint);

            var numberOfPoints = this.topPoints.length;
            if (numberOfPoints == 1)
                return;

            var previousTop = this.topPoints[numberOfPoints - 2];
            var previousBottom = this.bottomPoints[numberOfPoints - 2];
            var leftHeight = previousBottom[1] - previousTop[1];
            var rightHeight = bottomPoint[1] - topPoint[1];
            if (leftHeight == rightHeight)
                return;

            if (leftHeight > rightHeight)
                var meetingPoint = previousTop[0] -= 7;
            else
                var meetingPoint = topPoint[0] += 7;

            previousTop[0] = previousBottom[0] = topPoint[0] = bottomPoint[0] = meetingPoint;
        }

        this.name = name;

        // Normalize dates to all be at midnight.
        this.start = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
        this.end = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0);
        this.topPoints = [];
        this.bottomPoints = [];
        this.path = null;
    },

    Slice: function(start, end) {
        this.addPointsToReservations = function() {
            var numReservations = this.reservations.length;
            var totalPadding = (2 * BlockPuzzle.TRACK_BORDER_WIDTH) +
                                numReservations * 2 * BlockPuzzle.RESERVATION_PADDING;
            var reservationHeight = (this.size[1] - totalPadding) / numReservations;
            var totalDrawnHeight = (numReservations * reservationHeight) + totalPadding;
            var offset = ((this.size[1] - totalDrawnHeight) / 2) + BlockPuzzle.TRACK_BORDER_WIDTH;

            for (var i = 0; i < numReservations; i++) {
                offset += BlockPuzzle.RESERVATION_PADDING;

                this.reservations[i].addPoints([this.origin[0], offset],
                                               [this.origin[0], offset + reservationHeight]);
                this.reservations[i].addPoints([this.origin[0] + this.size[0], offset],
                                               [this.origin[0] + this.size[0], offset + reservationHeight]);

                offset += reservationHeight + BlockPuzzle.RESERVATION_PADDING;
            }
        }

        this.containsReservation = function(reservation) {
            return reservation.end >= this.start && reservation.start < this.end;
        }

        this.start = start;
        this.end = end;
        this.reservations = [];
        this.size = null;
        this.origin = null;
    },

    Track: function(name) {
        this.buildSlices = function(container) {
            var dates = [];
            for (var i = 0; i < this.reservations.length; i++) {
                dates.push(this.reservations[i].start);

                var end = new Date(this.reservations[i].end);
                end.setDate(end.getDate() + 1);
                dates.push(end);
            }

            dates.sort(function(date1, date2) {
                return date1 > date2;
            });

            for (var i = 1; i < dates.length; i++) {
                if (dates[i-1].getTime() == dates[i].getTime())
                    continue;
                this.slices.push(new BlockPuzzle.Slice(dates[i-1], dates[i]));
            }

            for (var i = 0; i < this.reservations.length; i++) {
                var reservation = this.reservations[i];
                for (var j = 0; j < this.slices.length; j++) {
                    if (this.slices[j].containsReservation(reservation)) {
                        this.slices[j].reservations.push(reservation);
                    }
                }
            }
        }

        this.buildDOM = function(container) {
            if (this.transform === null)
                this.transform = document.createElementNS("http://www.w3.org/2000/svg", "g");

            container.appendChild(this.transform);

            if (this.rect === null) {
                this.rect = new BlockPuzzle.Rect();
                this.rect.setFill("rgba(0, 0, 0, 0)");
                this.rect.setStroke(BlockPuzzle.TRACK_BORDER_WIDTH, "rgb(256, 0, 0)");
            }

            this.transform.appendChild(this.rect.getElement());

            for (var i = 0; i < this.reservations.length; i++)
                this.reservations[i].buildDOM(this.transform);
        };

        this.setReservations = function(reservations) {
            this.reservations  = reservations;
            this.buildSlices();
        }

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
                slice.addPointsToReservations();
            }

            for (var i = 0; i < this.reservations.length; i++) {
                this.reservations[i].positionAndSizeElements();
            }

        }

        this.origin = [0, 0];
        this.size = [0, 0];
        this.name = name;
        this.transform = null;
        this.rect = null;
        this.reservations = [];
        this.slices = []
    },

    Canvas: function(elementName) {
        this.getDateOffsetXCoordinate = function(offset) {
            return (offset + 1) * this.dayWidth;
        }

        this.getDateXCoordinate = function(date) {
            // Expensive way to calculate the date offset in our date range, that avoids
            // tricky calculations involving daylight savings time.
            for (var i = 0; i < this.dates.length; i++) {
                if (this.dates[i].containsDate(date))
                    return this.getDateOffsetXCoordinate(i);
            }
            console.error("Could not get offset for date: " + date);
            return 0;
        }

        this.positionAndSizeElements = function(object) {
            if (this.width == this.parentElement.clientWidth &&
                this.height == this.parentElement.clientHeight)
                return;

            var heightBetweenTracks = BlockPuzzle.TRACK_HEIGHT + BlockPuzzle.TRACK_GAP;
            this.height = heightBetweenTracks * this.tracks.length - BlockPuzzle.TRACK_GAP;
            this.width = this.parentElement.clientWidth;
            this.dayWidth = this.width / this.dates.length;

            this.element.style.width = this.width;
            this.element.style.height = this.height;
            this.element.setAttribute("viewBox", "0 0 " + this.width + " " + this.height);

            for (var i = 0; i < this.dates.length; i++) {
                this.dates[i].positionAndSizeElements(canvas, i);
            }

            for (var i = 0; i < this.tracks.length; i++) {
                this.tracks[i].origin = [0, heightBetweenTracks * i];
                this.tracks[i].size = [canvas.width, BlockPuzzle.TRACK_HEIGHT];
                this.tracks[i].positionAndSizeElements(canvas);
            }
        }

        this.fillDatesArray = function() {
            this.dates = [];
            var currentDate = this.startDate;
            while (currentDate <= this.endDate) {
                var nextDate = new Date(currentDate);
                nextDate.setDate(currentDate.getDate() + 1);

                this.dates.push(new BlockPuzzle.Day(currentDate, nextDate.getDate() == 1));

                currentDate = nextDate;
            }
        }

        this.calculateStartAndEndDates = function(data) {
            this.startDate = null;
            this.endDate = null;

            for (var i = 0; i < this.tracks.length; i++) {
                var reservations = this.tracks[i].reservations;
                for (var j = 0; j < reservations.length; j++) {
                    var reservation = reservations[j];

                    if (this.startDate === null || this.startDate > reservation.startDate) {
                        this.startDate =
                            new Date(reservation.start.getFullYear(), 0, 1, 0, 0, 0, 0);
                    }

                    if (this.endDate === null || this.endDate < reservation.endDate) {
                        this.endDate =
                            new Date(reservation.end.getFullYear(), 11, 31, 0, 0, 0, 0);
                    }
                }
            }

            this.fillDatesArray();
        }

        this.setData = function(data) {
            for (var i = 0; i < data.length; i++) {
                var track = new BlockPuzzle.Track(data[i].name);
                var reservations = [];
                for (var j = 0; j < data[i].reservations.length; j++) {
                    var reservation = data[i].reservations[j];
                    reservations.push(new BlockPuzzle.Reservation(reservation[0],
                                                                  reservation[1],
                                                                  reservation[2]));
                }
                track.setReservations(reservations);
                this.tracks.push(track);
            }

            this.calculateStartAndEndDates();

            this.buildDOM();
            this.positionAndSizeElements();
        }

        this.buildDOM = function() {
            while (this.element.firstChild) {
                this.element.removeChild(this.element.firstChild);
            }

            for (var i = 0; i < this.dates.length; i++) {
                this.dates[i].buildDOM(this.element);
            }

            for (var i = 0; i < this.tracks.length; i++) {
                this.tracks[i].buildDOM(this.element);
            }
        }

        this.tracks = [];

        this.parentElement = document.getElementById(elementName);
        this.element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.parentElement.appendChild(this.element);

        var this_ = this;
        window.onresize = function() {
            this_.positionAndSizeElements();
        }
    },
}
