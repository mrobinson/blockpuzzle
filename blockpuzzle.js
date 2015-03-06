var BlockPuzzle = {
    TRACK_HEIGHT: 40,
    RESERVATION_PADDING: 2,
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
            self.element.setAttribute("x", origin[0]);
            self.element.setAttribute("y", origin[1]);
        };

        this.setSize = function(size) {
            self.element.setAttribute("width", size[0]);
            self.element.setAttribute("height", size[1]);
        };

        this.setFill = function(fill) {
            self.element.style.fill = fill;
        };

        this.setStroke = function(width, color) {
            self.element.setAttribute("stroke", color);
            self.element.setAttribute("stroke-width", width);
        };

        var self = this;
        self.element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
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
        this.buildDOM = function(container) {
            if (self.rect === null) {
                self.rect = new BlockPuzzle.Rect();
                self.rect.setFill("rgba(150, 150, 150, 1)");
            }

            container.appendChild(self.rect.getElement());
        }

        var self = this;
        self.name = name;

        // Normalize dates to all be at midnight.
        self.start = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
        self.end = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0);
        self.rect = null;
    },

    Track: function(name) {
        this.buildDOM = function(container) {
            if (self.transform === null) {
                self.transform = document.createElementNS("http://www.w3.org/2000/svg", "g");
            }
            container.appendChild(self.transform);

            if (self.rect === null) {
                self.rect = new BlockPuzzle.Rect();
                self.rect.setFill("rgba(0, 0, 0, 0)");
                self.rect.setStroke(1, "rgb(256, 0, 0)");
            }
            this.transform.appendChild(self.rect.getElement());

            for (var i = 0; i < self.reservations.length; i++)
                self.reservations[i].buildDOM(self.transform);
        };

        this.addReservation = function(reservation) {
            this.reservations.push(reservation);
        }

        this.setOrigin = function(origin) {
            this.origin = origin;
        }

        this.positionAndSizeElements = function(canvas, trackIndex) {
            self.transform.setAttribute("transform",
                "translate(" + self.origin[0] + "," + self.origin[1] + ")");

            self.rect.setOrigin([0, 0]);
            self.rect.setSize([canvas.width, BlockPuzzle.TRACK_HEIGHT]);

            var numReservations = self.reservations.length;
            var totalPadding = 2 + numReservations * 2 * BlockPuzzle.RESERVATION_PADDING;
            var reservationHeight = (BlockPuzzle.TRACK_HEIGHT - totalPadding) / numReservations;
            var totalDrawnHeight = (numReservations * reservationHeight) + totalPadding;
            var offset = ((BlockPuzzle.TRACK_HEIGHT - totalDrawnHeight) / 2) + 1;

            for (var i = 0; i < numReservations; i++) {
                offset += BlockPuzzle.RESERVATION_PADDING;

                var reservation = self.reservations[i];
                var x = canvas.getDateXCoordinate(reservation.start) - canvas.dayWidth;
                var width = canvas.getDateXCoordinate(reservation.end) - x;

                reservation.rect.setOrigin([x, offset]);
                reservation.rect.setSize([width, reservationHeight]);

                offset += reservationHeight + BlockPuzzle.RESERVATION_PADDING;
            }
        }

        var self = this;
        this.origin = [0, 0];
        this.name = name;
        this.transform = null;
        this.rect = null;
        this.reservations = [];
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

            self.height = BlockPuzzle.TRACK_HEIGHT * self.tracks.length;
            self.width = self.parentElement.clientWidth;
            self.dayWidth = self.width / self.dates.length;

            self.element.style.width = self.width;
            self.element.style.height = self.height;
            self.element.setAttribute("viewBox", "0 0 " + self.width + " " + self.height);

            for (var i = 0; i < self.dates.length; i++) {
                self.dates[i].positionAndSizeElements(canvas, i);
            }

            for (var i = 0; i < self.tracks.length; i++) {
                self.tracks[i].setOrigin([0, BlockPuzzle.TRACK_HEIGHT * i]);
                self.tracks[i].positionAndSizeElements(canvas, i);
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
