var BlockPuzzle = {
    TRACK_HEIGHT: 40,
    TRACK_BORDER_WIDTH: 1,
    TRACK_GAP: 5,
    RESERVATION_PADDING: 1,

    Line: function() {
        this.getElement = function() {
            return self.element;
        };

        this.setPoints = function(point1, point2) {
            self.element.setAttribute("x1", point1[0]);
            self.element.setAttribute("y1", point1[1]);
            self.element.setAttribute("x2", point2[0]);
            self.element.setAttribute("y2", point2[1]);
        };

        this.setStroke = function(width, color) {
            self.element.setAttribute("stroke", color);
            self.element.setAttribute("stroke-width", width);
        };

        this.setVisible = function(visible) {
            if (visible) {
                self.element.setAttribute("visibility", "visible");
            } else {
                self.element.setAttribute("visibility", "hidden");
            }
        };

        var self = this;
        this.element = document.createElementNS("http://www.w3.org/2000/svg", "line");
    },

    Rect: function() {
        this.getElement = function() {
            return self.element;
        };

        this.setOrigin = function(origin) {
            this.origin = origin;
            self.element.setAttribute("x", origin[0]);
            self.element.setAttribute("y", origin[1]);
        };

        this.setSize = function(size) {
            this.size = size;
            self.element.setAttribute("width", size[0]);
            self.element.setAttribute("height", size[1]);
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
            self.element.style.fill = fill;
        };

        this.setStroke = function(width, color) {
            self.element.setAttribute("stroke", color);
            self.element.setAttribute("stroke-width", width);
        };

        var self = this;
        self.element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.origin = [0, 0]
        this.size = [0, 0]
    },

    Day: function(date, lastDayOfMonth) {
        this.buildDOM = function(container) {
            if (self.line === null) {
                self.line = new BlockPuzzle.Line();
                if (self.lastDayOfMonth)
                    self.line.setStroke(2, "rgba(100, 100, 100, 0.5)");
                else
                    self.line.setStroke(1, "rgba(200, 200, 200, 0.4)");
            }

            container.appendChild(self.line.getElement());
        }

        this.positionAndSizeElements = function(canvas, dayIndex) {
            var x = canvas.getDateOffsetXCoordinate(dayIndex);
            self.line.setVisible(self.lastDayOfMonth || canvas.dayWidth > 2);
            self.line.setPoints([x, 0], [x, canvas.height]);
        }

        this.containsDate = function(date) {
            return date.getFullYear() == self.date.getFullYear() &&
                   date.getMonth() == self.date.getMonth() &&
                   date.getDate() == self.date.getDate();
        }

        var self = this;
        self.line = null;
        self.date = date;
        self.lastDayOfMonth = lastDayOfMonth;
    },

    Reservation: function(name, start, end) {
        var self = this;
        self.name = name;

        // Normalize dates to all be at midnight.
        self.start = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
        self.end = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0);
        self.rect = null;
    },

    Slice: function(start, end) {
        this.buildDOM = function(container) {
            this.rects = [];
            for (var i = 0; i < this.reservations.length; i++) {
                var rect = new BlockPuzzle.Rect();
                rect.setFill("rgba(50, 150, 150, 1)");
                this.rects.push(rect);
                container.appendChild(rect.getElement());
            }
        }

        this.positionAndSizeElements = function(canvas) {
            var numReservations = this.rects.length;
            var totalPadding = (2 * BlockPuzzle.TRACK_BORDER_WIDTH) +
                                numReservations * 2 * BlockPuzzle.RESERVATION_PADDING;
            var reservationHeight = (this.size[1] - totalPadding) / numReservations;
            var totalDrawnHeight = (numReservations * reservationHeight) + totalPadding;
            var offset = ((this.size[1] - totalDrawnHeight) / 2) + BlockPuzzle.TRACK_BORDER_WIDTH;

            for (var i = 0; i < numReservations; i++) {
                offset += BlockPuzzle.RESERVATION_PADDING;

                this.rects[i].setOrigin([this.origin[0], offset]);
                this.rects[i].setSize([this.size[0], reservationHeight]);

                offset += reservationHeight + BlockPuzzle.RESERVATION_PADDING;
            }
        }

        this.fixupReservationConnections = function(previousSlice) {
            for (var i = 0; i < previousSlice.reservations.length; i++) {
                for (var j = 0; j < this.reservations.length; j++) {
                    if (this.reservations[j] != previousSlice.reservations[i])
                        continue;

                    var rightRect = this.rects[j];
                    var leftRect = previousSlice.rects[i];
                    var smallRight = rightRect.size[1] < leftRect.size[1];

                    if (smallRight) {
                        leftRect.setSize([leftRect.size[0] - 10, leftRect.size[1]]);
                    } else {
                        rightRect.setOrigin([rightRect.origin[0] + 10, rightRect.origin[1]]);
                        rightRect.setSize([rightRect.size[0] - 10, rightRect.size[1]]);
                    }

                    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute("d",
                        "M " + leftRect.topRight().join(" ") + " " +
                        "L " + rightRect.origin.join(" ") + " " +
                        "L " + rightRect.bottomLeft().join(" ") +
                        "L " + leftRect.bottomRight().join(" "));
                    path.setAttribute("fill", "rgba(50, 150, 150, 1)");
                    leftRect.getElement().parentElement.appendChild(path);
                }
            }
        }

        this.containsReservation = function(reservation) {
            return reservation.end >= this.start && reservation.start < this.end;
        }

        this.start = start;
        this.end = end;
        this.reservations = [];
        this.rects = [];
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
            this.buildSlices();

            if (self.transform === null) {
                self.transform = document.createElementNS("http://www.w3.org/2000/svg", "g");
            }
            container.appendChild(self.transform);

            if (self.rect === null) {
                self.rect = new BlockPuzzle.Rect();
                self.rect.setFill("rgba(0, 0, 0, 0)");
                self.rect.setStroke(BlockPuzzle.TRACK_BORDER_WIDTH, "rgb(256, 0, 0)");
            }
            this.transform.appendChild(self.rect.getElement());

            for (var i = 0; i < self.slices.length; i++)
                self.slices[i].buildDOM(self.transform);
        };

        this.addReservation = function(reservation) {
            this.reservations.push(reservation);
        }

        this.positionAndSizeElements = function(canvas) {
            self.transform.setAttribute("transform",
                "translate(" + self.origin[0] + "," + self.origin[1] + ")");

            self.rect.setOrigin([0, 0]);
            self.rect.setSize([self.size[0], self.size[1]]);

            for (var i = 0; i < this.slices.length; i++) {
                var slice = this.slices[i];
                var x = canvas.getDateXCoordinate(slice.start) - canvas.dayWidth;
                var width = canvas.getDateXCoordinate(slice.end) - x;

                slice.origin = [x, this.origin[1]];
                slice.size = [width, BlockPuzzle.TRACK_HEIGHT];
                slice.positionAndSizeElements(canvas);
            }

            for (var i = 1; i < self.slices.length; i++) {
                self.slices[i].fixupReservationConnections(self.slices[i - 1]);
            }
        }

        var self = this;
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
            return (offset + 1) * self.dayWidth;
        }

        this.getDateXCoordinate = function(date) {
            // Expensive way to calculate the date offset in our date range, that avoids
            // tricky calculations involving daylight savings time.
            for (var i = 0; i < self.dates.length; i++) {
                if (self.dates[i].containsDate(date))
                    return self.getDateOffsetXCoordinate(i);
            }
            console.error("Could not get offset for date: " + date);
            return 0;
        }

        this.positionAndSizeElements = function(object) {
            if (self.width == self.parentElement.clientWidth &&
                self.height == self.parentElement.clientHeight)
                return;

            var heightBetweenTracks = BlockPuzzle.TRACK_HEIGHT + BlockPuzzle.TRACK_GAP;
            self.height = heightBetweenTracks * self.tracks.length - BlockPuzzle.TRACK_GAP;
            self.width = self.parentElement.clientWidth;
            self.dayWidth = self.width / self.dates.length;

            self.element.style.width = self.width;
            self.element.style.height = self.height;
            self.element.setAttribute("viewBox", "0 0 " + self.width + " " + self.height);

            for (var i = 0; i < self.dates.length; i++) {
                self.dates[i].positionAndSizeElements(canvas, i);
            }

            for (var i = 0; i < self.tracks.length; i++) {
                self.tracks[i].origin = [0, heightBetweenTracks * i];
                self.tracks[i].size = [canvas.width, BlockPuzzle.TRACK_HEIGHT];
                self.tracks[i].positionAndSizeElements(canvas);
            }
        }

        this.fillDatesArray = function() {
            self.dates = [];
            var currentDate = self.startDate;
            while (currentDate <= self.endDate) {
                var nextDate = new Date(currentDate);
                nextDate.setDate(currentDate.getDate() + 1);

                self.dates.push(new BlockPuzzle.Day(currentDate, nextDate.getDate() == 1));

                currentDate = nextDate;
            }
        }

        this.calculateStartAndEndDates = function(data) {
            self.startDate = null;
            self.endDate = null;

            for (var i = 0; i < self.tracks.length; i++) {
                var reservations = self.tracks[i].reservations;
                for (var j = 0; j < reservations.length; j++) {
                    var reservation = reservations[j];

                    if (self.startDate === null || self.startDate > reservation.startDate) {
                        self.startDate =
                            new Date(reservation.start.getFullYear(), 0, 1, 0, 0, 0, 0);
                    }

                    if (self.endDate === null || self.endDate < reservation.endDate) {
                        self.endDate =
                            new Date(reservation.end.getFullYear(), 11, 31, 0, 0, 0, 0);
                    }
                }
            }

            self.fillDatesArray();
        }

        this.setData = function(data) {
            for (var i = 0; i < data.length; i++) {
                var track = new BlockPuzzle.Track(data[i].name);
                for (var j = 0; j < data[i].reservations.length; j++) {
                    var reservation = data[i].reservations[j];
                    track.addReservation(new BlockPuzzle.Reservation(reservation[0],
                                                                     reservation[1],
                                                                     reservation[2]));
                }
                self.tracks.push(track);
            }

            self.calculateStartAndEndDates();

            self.buildDOM();
            self.positionAndSizeElements();
        }

        this.buildDOM = function() {
            while (self.element.firstChild) {
                self.element.removeChild(self.element.firstChild);
            }

            for (var i = 0; i < self.dates.length; i++) {
                self.dates[i].buildDOM(self.element);
            }

            for (var i = 0; i < self.tracks.length; i++) {
                self.tracks[i].buildDOM(self.element);
            }
        }

        var self = this;
        self.tracks = [];

        self.parentElement = document.getElementById(elementName);
        self.element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        self.parentElement.appendChild(this.element);

        window.onresize = function() {
            self.positionAndSizeElements();
        }
    },
}
